import React, { createContext, ReactElement, useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { Account, Card, ExampleSentence, TDeckInfo, Word } from "../../global";
import { changeWordKnownLevel, createCard, deleteCard, getCard, getCardsForWord, getExampleSentencesForWord, getNewWordsList, getTDeckListForUser, getWord, getWordsInDeck, updateCard, updateNewWordsList } from "./service/requestHelper";
import { Form, Link, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { EditTextarea } from "react-edit-text";
import { Updater, useImmer } from "use-immer";
import { Button, Modal } from "react-bootstrap";
import { v4 as uuidv4 } from 'uuid';
import { TimeContext } from "./context/TimeContextProvider";
import BForm from 'react-bootstrap/Form'

interface CardView {
  cardId: string
  card?: Card
  onPage: boolean
}

interface WordView {
  kanji: string
  wordId: string
  onPage: boolean
  knownLevel: number | null
  cards?: CardView[]
}

interface PageState {
  words?: WordView[]
}

interface PageContextT {
  pageState: PageState;
  updatePageState: Updater<PageState>
}

const PageContext = createContext<PageContextT>({
  pageState: {},
  updatePageState: () => {}
});

function PageContextProvider({children}: {children: ReactElement}) {
  const [pageState, updatePageState] = useImmer<PageState>({})
  return (
    <PageContext.Provider value={{
      pageState: pageState,
      updatePageState: updatePageState
    }}>
      {children}
    </PageContext.Provider>
  )
}

async function getCardFromWord(word: Word, acct: Account, timestamp: number) {
  const currTimestamp = timestamp;
  const newCard : Card = {
    id: 'new',
    accountId: acct.id,
    wordId: word.id,
    cardData: {
      entrySeq: word.entrySeq,
      kanji: word.kanji,
      kanjiOther: word.kanjiOther.join(', '),
      reading: word.reading,
      readingOther: word.readingOther.join(', '),
      definitions: word.definitions.map((def, i) => `${i + 1}. ${def.glosses.join(';')}. ${def.positions.join(', ')}`).join('\n'),
      exampleSentences: []
    },
    knownLevel: 0,
    lastReviewed: null,
    timeDue: new Date(currTimestamp + 1800 * 1000), // due half an hour from now
    dateAdded: new Date(currTimestamp)
  }
  const egSentences = await getExampleSentencesForWord(acct.username, acct.password, word.id);
  if ('error' in egSentences) {
    window.alert(egSentences.error)
  } else {
    newCard.cardData.exampleSentences = egSentences
  }
  return newCard
}

// reset what cards should be shown
async function getAndDisplayCardsForWord(pageState: PageState, updatePageState: Updater<PageState>, acct: Account, wIndex: number) {
  const fetchedCards = await getCardsForWord(acct.username,acct.password, pageState.words![wIndex].wordId)
  if ('error' in fetchedCards) {
    window.alert('can\'t get cards')
    return;
  }
  if (fetchedCards.length > 0) {
    updatePageState(old => {
      const cardsNew = fetchedCards.map(c => {
        return {
          cardId: c.id,
          onPage: false
        }
      })
      cardsNew[0].onPage = true;
      // add a page for creating new cards
      cardsNew.push({cardId: "new", onPage: false})
      old.words![wIndex].cards = cardsNew;
    })
  } else {
    updatePageState(old => {
      old.words![wIndex].cards = [{cardId: "new", onPage: true}]
    })
  }
}

async function getAndDisplayCard(pageState: PageState, updatePageState: Updater<PageState>, acct: Account, wIndex: number, cIndex: number, timestamp: number) {
  const wordView = pageState.words![wIndex];
  const cardView = pageState.words![wIndex].cards![cIndex];
  if (cardView.cardId == "new") {
    // open editor for new card
    const word = await getWord(acct.username, acct.password, wordView.wordId);
    if ('error' in word) {
      return;
    }
    const newCard = await getCardFromWord(word, acct, timestamp);
    updatePageState(old => {
      old.words![wIndex].cards![cIndex].card = newCard;
    });
  } else {
    const fetchedCard = await getCard(acct.username, acct.password, cardView.cardId);
    if ('error' in fetchedCard) {
      return;
    }
    updatePageState(old => {
      old.words![wIndex].cards![cIndex].card = fetchedCard;
    })
  }
}

function CardView({wIndex, cIndex} : {wIndex: number, cIndex: number}) {
  const authContext = useContext(AuthContext)
  const acct = authContext.account as Account;
  const pageContext = useContext(PageContext);
  const timeContext = useContext(TimeContext)
  const pageState = pageContext.pageState;
  const updatePageState = pageContext.updatePageState;

  const wordView = pageState.words![wIndex];
  const cardView = pageState.words![wIndex].cards![cIndex];

  useEffect(() => {
    async function mount() {
      if (cardView.card) {
        // system already knows card, don't do anything
        return;
      }
      await getAndDisplayCard(pageState, updatePageState, acct, wIndex, cIndex, timeContext.getCurrentTimestamp())
    }
    mount();
  }, [pageState])
  const card = pageState.words![wIndex].cards![cIndex].card;

  const [jpn_input, setJpn_input] = useState('');
  const [eng_inp, setEng_input] = useState('');

  return (
    card ?
      <>
        <div> cardID: {card.id}</div>
        <div> dateAdded: {(new Date(card.dateAdded)).toLocaleString()} </div>
        <h1 style={{fontSize: 50}}> {card!.cardData.kanji}</h1>
        <div>
          reading: 
          {card.cardData.reading}
        </div>
        <div>
          other readings: 
          {card.cardData.readingOther}
        </div>
        <div>definitions (click box to edit):</div>
        <EditTextarea 
          name='definitions'
          style={{border: '1px solid black'}}
          value={card!.cardData.definitions}
          onChange={(e) => {
            updatePageState(old => {
              old.words![wIndex].cards![cIndex].card!.cardData.definitions = e.target.value;
            })
          }}
        />
        <h3>example sentences</h3>
        <div>
          <input type='checkbox'></input>
          pick random sentence each time
        </div>
        <div>
          <input type='checkbox'></input>
          set fixed example sentence
        </div>
        <div style={{border: '1px solid black'}}>
          {
            card.cardData.exampleSentences.length > 0 ?
            card.cardData.exampleSentences.map(s => {
              return (
                <div key={s.id} style={{border: '1px solid black', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '0.5em', paddingRight: '0.5em', margin: '1em'}}>
                  <div>
                    <div>{s.jpn}</div>
                    <div>{s.eng}</div>
                  </div>
                  <button style={{border: '1px solid red', padding: '0.3em'}} onClick={(e) => {
                    let res = window.confirm('delete this sentence?')
                    if (res) {
                      updatePageState(old => {                        
                        old.words![wIndex].cards![cIndex].card!.cardData.exampleSentences =
                        old.words![wIndex].cards![cIndex].card!.cardData.exampleSentences.filter(s_j => s_j.id != s.id)
                      })
                    }
                  }}>
                    X
                  </button>
                </div>
              )
            })
            :
            <div>no sentences</div>
          }
        </div>
        <div style={{marginTop: '1em'}}>
          <h4>add sentence</h4>
          <div style={{display: 'flex', justifyContent: 'space-between', margin: '1em 0'}}>
            <label htmlFor="f1" style={{marginRight: '1em'}}>JPN</label> 
            <input id="f1" type="text" style={{width: '100%'}} value={jpn_input} onChange={(e) => {
              setJpn_input(e.target.value);
            }}/>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', margin: '1em 0'}}>
            <label htmlFor="f2" style={{marginRight: '1em'}}>ENG</label> 
            <input id="f2" type="text" style={{width: '100%'}} value={eng_inp} onChange={(e) => {
              setEng_input(e.target.value)
            }}/>
          </div>
          <button onClick={() => {
            if (!jpn_input) {
              window.alert('jpn input is empty')
              return;
            }
            // add example sentence
            const egSentences = pageState.words![wIndex].cards![cIndex].card!.cardData.exampleSentences
            let newSentenceId: string;
            for (
              newSentenceId = "custom-" + uuidv4(); 
              egSentences.find(s => s.id == newSentenceId);
              newSentenceId = "custom-" + uuidv4()
            ) {}
            const wordsToMatch = [card.cardData.kanji].concat([card.cardData.kanjiOther]);
            // see if 'jpn_input' contains the word
            const foundWordForm = wordsToMatch.find(w => jpn_input.includes(w))
            if (!foundWordForm) {
              window.alert(`word "${wordsToMatch}" not in sentence`)
              return;
            }
            const newSentence: ExampleSentence = {
              id: newSentenceId,
              jpn: jpn_input,
              eng: eng_inp,
              default_word_wordForm: foundWordForm,
              default_wordId: pageState.words![wIndex].wordId
            }
            updatePageState(old => {
              old.words![wIndex].cards![cIndex].card!.cardData.exampleSentences.push(newSentence)
            })
            setJpn_input('')
            setEng_input('')
          }}>
            submit
          </button>
        </div>

        <br></br>
        {
          cardView.cardId == "new" ?
          // [create new card]
          <button style={{backgroundColor: 'lightblue', fontSize: '20px'}} onClick={async () => {
            updatePageState(old => {
              old.words![wIndex].cards![cIndex].card!.dateAdded = new Date(timeContext.getCurrentTimestamp());
            })
            let card = pageState.words![wIndex].cards![cIndex]!.card!;
            const res = await createCard(acct.username, acct.password, card);
            console.log('created card:');
            console.log(res);

            if (!wordView.knownLevel) {
              // update known level of word, if it is not already known
              await changeWordKnownLevel(acct.username, acct.password, wordView.wordId, '0')
              updatePageState(old => {
                old.words![wIndex].knownLevel = 0
              })
            }


            // reset page state
            await getAndDisplayCardsForWord(pageState, updatePageState, acct, wIndex);
          }}>
            create new card
          </button>
          :
          <>
            <button onClick={async () => {
              const card = cardView.card!;
              const res = await updateCard(acct.username, acct.password, cardView.cardId, card);
              console.log(res);
              getAndDisplayCardsForWord(pageState, updatePageState, acct, wIndex)
            }}>
              save changes
            </button>
            <button onClick={async() => {
              if (window.confirm('are you sure you want to delete this card? (cannot be undone)')) {
                const cardId = cardView.cardId;
                const res = await deleteCard(acct.username, acct.password, cardId);
                console.log(res);
                if (wordView.cards!.length == 2) {
                  if (window.confirm('you just deleted all your cards for this word. Mark word as unknown?')) {
                    const res = await changeWordKnownLevel(acct.username, acct.password, wordView.wordId, 'null')
                    updatePageState(old => {
                      old.words![wIndex].knownLevel = null
                    })
                  }
                }
                getAndDisplayCardsForWord(pageState, updatePageState, acct, wIndex)
              }
            }}>
              delete card
            </button>
          </>

        }

      </>
    :
      <div>loading...</div>
  )
}

// precondition: ensure that 'word' is loaded
function WordView({wIndex} : {wIndex: number}) {
  const authContext = useContext(AuthContext)
  const acct = authContext.account as Account;
  const pageContext = useContext(PageContext);
  const pageState = pageContext.pageState;
  const updatePageState = pageContext.updatePageState;
  
  useEffect(() => {
    async function onMount() {
      if (pageState.words![wIndex].cards) {
        // system already knows cards in word, don't do anything
        return;
      }
      getAndDisplayCardsForWord(pageState, updatePageState, acct, wIndex)
    }
    onMount()
  }, [pageState])
  const cardViews = pageState.words![wIndex].cards;
  let toDisplay;
  
  if (cardViews) {
    const cardIndx = cardViews.findIndex(cv => cv.onPage)
    toDisplay = 
    <>
      {
        cardViews.length > 1
        ? 
        <div>You already have cards for this word. Select 'new' to create another one</div>
        :
        <div>You have no cards for this word. Select 'create new card' once you have finished learning it. You may also edit the card.</div>
      }
      <div style={{display: 'flex', alignItems: 'center', border: '1px solid black'}}>
        {
          cardViews.map((cv, i) => {
            let style : React.CSSProperties;
            if (cv.onPage) {
              style = {border: '1px solid black', paddingLeft: '0.5em', paddingRight: '0.5em', margin: '1em', textWrap: 'nowrap', backgroundColor: 'limegreen'}
            } else {
              style = {border: '1px solid black', paddingLeft: '0.5em', paddingRight: '0.5em', margin: '1em', backgroundColor: 'whitesmoke', textWrap: 'nowrap'}
            }
            return (
              <div key={cv.cardId} style={style} onClick={(e) => {
                updatePageState(old => {
                  for (let j = 0; j < old.words![wIndex].cards!.length; j++) {
                    if (j == i) {
                      old.words![wIndex].cards![j].onPage = true;
                    } else {
                      old.words![wIndex].cards![j].onPage = false;
                    }
                  }
                })
              }}> 
                {cv.cardId == "new" ? "new" : (i + 1)}
              </div>
            )
          })
        }
      </div>
      <div>
        <CardView wIndex={wIndex} cIndex={cardIndx}/>
      </div>
    </>
  } else {
    toDisplay = <div>loading...</div>
  }

  return (
    toDisplay
  )
}
const WORDS_PER_PAGE = 10
function SpecificDeck({currWordListR, updateCurrWordListR}: {currWordListR: CurrWordListR,updateCurrWordListR: Updater<CurrWordListR>}) {
  const { deckId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const saveContext = useContext(SaveContext)
  const pageIdx = searchParams.get('pageIdx')
  const [words, setWords] = useState<Word[]>();
  const authContext = useContext(AuthContext);
  const acct = authContext.account!;

  useEffect(() => {
    async function fetchAndSetWords() {
      const fetchedWords = await getWordsInDeck(acct.username, acct.password, deckId!, Number(pageIdx) * WORDS_PER_PAGE, WORDS_PER_PAGE);
      if ('error' in fetchedWords) {
        window.alert('couldn\'t fetch words')
        return;
      }
      console.log(fetchedWords);
      setWords(fetchedWords)
    }
    fetchAndSetWords();
  }, [searchParams])

  return (
    words ?
      <>
        <div>
          <button disabled={Number(pageIdx) == 0} onClick={() => {
            setSearchParams(old => {
              old.set('pageIdx', (Math.max(Number(old.get('pageIdx')) - 1, 0)).toString());               
              return old
            });
          }}>
            prev page
          </button>
          <button onClick={() => {
            setSearchParams(old => {
              old.set('pageIdx', (Number(old.get('pageIdx')) + 1).toString());               
              return old
            });
          }}>
            next page
          </button>
        </div>
        
        {
          words.map(w => {
            let kanjiColor = 'black';
            let def = '';
            if (w.knownLevel) {
              if (w.knownLevel == 0) {
                kanjiColor = 'blue'
                def = '(known level 0, new)'
              } else {
                kanjiColor = 'forestgreen'
                def = `(known level ${w.knownLevel})`
              }
            }

            const inCurrList = currWordListR.this && (currWordListR.this.findIndex(clw => clw.id === w.id) !== -1)

            return (
              <div style={{border: '1px solid black', padding: '0.5em', color: kanjiColor, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div style={{display: 'flex'}}>
                  <div style={{border: '1px solid black', padding: '0.1em'}}> {w.seqNum}</div>
                  <div style={{border: '1px solid black', fontSize: '20px', marginLeft: '1em', backgroundColor: 'whitesmoke'}}>
                    {w.kanji}
                  </div>
                  <div style={{marginLeft: '1em'}}>
                    {def}
                  </div>
                </div>
                <div>
                  <button style={{marginRight: '1em', backgroundColor: inCurrList ? 'pink' : 'lightblue'}} onClick={() => {
                    saveContext.upToDate = false;
                    if (inCurrList) {
                      // delete
                      updateCurrWordListR(old => {
                        old.this = old.this!.filter(clw => clw.id != w.id)
                      })
                    } else {
                      // add
                      updateCurrWordListR(old => {
                        old.this!.push(structuredClone(w));
                      })
                    }
                  }}>
                    {
                      inCurrList ? 'delete' : 'add'
                    }
                  </button>
                  <button style={{}}>view cards (todo)</button>
                </div>
                
              </div>
            )
          })
        }
      </>
    : <div>loading...</div>
  )
}

function FromTargetDeck({currWordListR, updateCurrWordListR}: {currWordListR: CurrWordListR, updateCurrWordListR: Updater<CurrWordListR>}) {
  const authContext = useContext(AuthContext)
  const acct = authContext.account!;
  const navigate = useNavigate();

  const [deckInfos, setDeckInfos] = useState<TDeckInfo[]>();
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>();

  useEffect(() => {
    async function mount() {
      const fetchedDeckInfos = await getTDeckListForUser(acct.username, acct.password);
      if ('error' in fetchedDeckInfos) {
        window.alert('couldnt fetch decks')
        return;
      }
      setDeckInfos(fetchedDeckInfos)
      const selectedDeckId = fetchedDeckInfos.length > 0 ? fetchedDeckInfos[0].id : null;
      setSelectedDeckId(selectedDeckId);
      navigate(`${selectedDeckId}?pageIdx=0`)
    }
    mount();
  }, []);

  let content = <></>
  if (deckInfos) {
    content =
    <>
      {
        deckInfos.length > 0 ?
        <>
          <div>select deck</div>
          <div>
          {/*deckInfos not null, has pos. length. So, selectedDeckId is defined*/}
          <select value={selectedDeckId!} onChange={(e) => {
            const deckId = e.target.value;
            setSelectedDeckId(deckId)
            navigate(`${deckId}?pageIdx=0`)
          }}>
            {deckInfos.map(di => {
              return <option value={di.id}>
                {di.name}
              </option>
            })}
          </select>
          </div>
          <Routes>
            <Route path=":deckId/*" element={<SpecificDeck currWordListR={currWordListR} updateCurrWordListR={updateCurrWordListR} />}/>
          </Routes>
        </>
        :
        <div>No target decks found</div>
      }
    </>
  } else {
    content = <div>loading...</div>
  }

  return (
    <>
      {content}
    </>
  )
}

interface CurrWordListR {
  this?: Word[]
}

interface SaveContextT {
  upToDate: boolean
}

const SaveContext = createContext<SaveContextT>({
  upToDate: true
})

function EditWordList() {
  const authContext = useContext(AuthContext)
  const timeContext = useContext(TimeContext)
  const saveContext = useContext(SaveContext)
  const pageContext = useContext(PageContext);
  const pageState = pageContext.pageState;
  const updatePageState = pageContext.updatePageState

  const acct = authContext.account!
  const [currWordListR, updateCurrWordListR] = useImmer<CurrWordListR>({});
  const navigate = useNavigate();

  useEffect(() => {
    async function mount() {
      const fetchedWords = await getNewWordsList(acct.username, acct.password, 'HIGHEST PRIO', timeContext.getCurrentTimestamp());
      if ('error' in fetchedWords) {
        window.alert('couldnt fetch new word list');
        return;
      }
      updateCurrWordListR(old => {
        old.this = fetchedWords
      })
    }
    mount();
  }, []);

  const currWordList = currWordListR.this;
  const change = pageState.words && currWordList && JSON.stringify(pageState.words.map(w => w.wordId).sort()) != JSON.stringify(currWordList.map(w => w.id).sort())

  return (
    <Modal show animation={false} size="xl" onHide={() => {
      if (change) {
        if (window.confirm('unsaved changes detected. Are you sure you wan\'t to exit?')) {
          navigate('/new-words')
        }
      } else {
        navigate('/new-words')
      }
    }}>
      <Modal.Header closeButton>
        <h1>edit word list</h1>
      </Modal.Header>
      <div style={{border: '1px solid red', minHeight: '70vh', padding: '0.5em'}}>
        <div>select word source</div>
        <div>
          <button onClick={() => navigate('fromTargetDeck')}>target deck</button>
          <button onClick={() => navigate('fromCustom')}>custom selection</button>
        </div>
        <div style={{border: '1px solid black', minHeight: '30vh', padding: '0.5em'}}>
          <Routes>
            <Route path="fromTargetDeck/*" element={<FromTargetDeck currWordListR={currWordListR} updateCurrWordListR={updateCurrWordListR}/>} />
            <Route path="fromCustom/*" element={<div>TODO</div>} />
          </Routes>
        </div>
        <h3>current word list</h3>
        <div style={{border: '1px solid black', padding: '0.5em', display: 'flex'}}>
          {
            currWordList ?
              currWordList.length > 0 ?
              currWordList.map(w => {
                return (
                  <div style={{border: '1px solid black', marginRight: '1em', backgroundColor: 'whitesmoke', position: 'relative'}}>
                    {w.kanji}
                  </div>
                )
                
              })
              :
              <div> no words</div>
            :
            <div>loading...</div>
          }
        </div>
        <button onClick={async () => {
          if (currWordList) {
            const res = await updateNewWordsList(acct.username, acct.password, currWordList.map(w => w.id))
            if ('error' in res) {
              window.alert('couldn\'t update new words list')
              return;
            }
            // update wordViews
            const newWordViews: WordView[] = currWordList.map(w => {
              return {
                wordId: w.id,
                kanji: w.kanji,
                knownLevel: w.knownLevel,
                onPage: false,
              }
            })
            if (newWordViews.length > 0) {
              newWordViews[0].onPage = true;
            }
            updatePageState(old => {
              old.words = newWordViews
            })
            window.alert('changes saved')
            // saveContext.upToDate = true
          }
        }}>save</button>
      </div>
      
    </Modal>
  )
}

export function NewWords() {
  const authContext = useContext(AuthContext)
  const acct = authContext.account as Account;
  const timeContext = useContext(TimeContext)

  const pageContext = useContext(PageContext);
  const pageState = pageContext.pageState;
  const updatePageState = pageContext.updatePageState;

  const navigate = useNavigate()

  useEffect(() => {
    // update wordViews after getting new words
    async function onMount() {
      if (pageState.words != undefined) {
        // system already knows words, don't do anything
        return;
      }
      const fetchedWords = await getNewWordsList(acct.username, acct.password, 'HIGHEST PRIO', timeContext.getCurrentTimestamp());
      // console.log(words);
      if ('error' in fetchedWords) {
        window.alert(fetchedWords.error);
        return;
      }      
      updatePageState(old => {
        const wordViews = fetchedWords.map(w => {
          return {
            kanji: w.kanji,
            wordId: w.id,
            onPage: false,
            knownLevel: w.knownLevel,
          }
        })
        if (wordViews.length > 0) {
          wordViews[0].onPage = true
        }
        old.words = wordViews;
      })
    }
    onMount()
  }, [])

  const wordViews = pageState.words;
  let toDisplay;
  if (wordViews) {
    const shownwIdx = wordViews.findIndex(wv => wv.onPage);
    toDisplay = 
    <>
      <Routes>
        <Route path="edit/*" element={<EditWordList />} />
      </Routes>
      
      <h1>learn new words</h1>
      <div>this list refreshes every day. Click the edit button on the left to edit this list</div>
      <div style={{display: 'flex', minHeight: '90vh', border: '1px solid red'}}>
        {/* left column to the words */}
        <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column', border: '1px solid black', minWidth: '8em', margin: '1em', padding: '1em'}}>
          <div style={{border: '1px solid black', textWrap: 'nowrap', marginBottom: '1em', padding: '0.5em'}}>
            <div>✔: known word</div>
            <div>🎯: daily word</div>
          </div>
          <button style={{textWrap: 'nowrap'}} onClick={() => navigate('edit')}>edit list ✎</button>
          {
            wordViews.length > 0 ?
            wordViews.map((wv, i) => {
                let style : React.CSSProperties;
                if (wv.onPage) {
                  style = {border: '1px solid black', paddingLeft: '0.5em', paddingRight: '0.5em', margin: '1em', textWrap: 'nowrap', backgroundColor: 'limegreen'}
                } else {
                  style = {border: '1px solid black', paddingLeft: '0.5em', paddingRight: '0.5em', margin: '1em', backgroundColor: 'whitesmoke', textWrap: 'nowrap'}
                }
                return (
                  <>
                  <div key={wv.kanji} style={style} onClick={(e) => {
                    updatePageState(old => {
                      for (let j = 0; j < old.words!.length; j++) {
                        if (j == i) {
                          old.words![j].onPage = true;
                        } else {
                          old.words![j].onPage = false;
                        }
                      }
                    })
                  }}>
                    {wv.kanji}
                    {wv.knownLevel != null ? "✔" : ''}
                  </div>
                  </>
                )
              })
            :
              <div>no new words</div>
          }
        </div>
        {/* word display*/}
        <div style={{border: '1px solid black', width: '100%', margin: '1em', padding: '1em'}}>
          {
            shownwIdx != -1 ?
            <WordView wIndex={shownwIdx}/>
            :
            <div>no word selected</div>
          }
        </div>
      </div>
    </>
  } else {
    toDisplay = <div>loading...</div>
  }
  return (
    toDisplay
  )
}

export function NewWords_() {
  const authContext = useContext(AuthContext);
  return (
    authContext.account ? 
    <PageContextProvider>
      <NewWords/> 
    </PageContextProvider>
    : 
    <div>you must login to access this feature</div>
  )
}