import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { Account, Card, Word } from "../../global";
import { getCard, getCardsForWord, getExampleSentencesForWord, getNewWordsList, getWord } from "./service/requestHelper";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { EditTextarea } from "react-edit-text";
import { useImmer } from "use-immer";


async function getCardFromWord(word: Word, acct: Account) {
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
    dateAdded: new Date()
  }
  const egSentences = await getExampleSentencesForWord(acct.username, acct.password, word.id);
  if ('error' in egSentences) {
    window.alert(egSentences.error)
  } else {
    newCard.cardData.exampleSentences = egSentences
  }
  return newCard
}

// given a Card
//  - display editor which autofills based on the word / the existing card
//  - allow users to make edits
//  - makes the API call to create / change existing card when user presses 'save' (or similar)
function CardEditor({wordId}: {wordId: string})
{
  const authContext = useContext(AuthContext)
  const acct = authContext.account as Account;
  const { cardId } = useParams();
  const [err, setErr] = useState('xxx');

  interface ImmerState {
    this?: Card
  }

  const [state, updateState] = useImmer<ImmerState>({});
  // const [defs_textArea, setDefs_textArea] = useState('');
  
  useEffect(() => {
    async function mount() {
      if (!cardId) {
        setErr('no cardId found')
        return;
      }
      if (cardId == 'new') {
        const word = await getWord(acct.username, acct.password, wordId);
        if ('error' in word) {
          setErr('word not found')
          return;
        }
        const fetchedCard = await getCardFromWord(word, acct);
        // setDefs_textArea(card.cardData.definitions)
        updateState(draft => {
          draft.this = fetchedCard
        })        
        setErr('')
      } else {
        const card = await getCard(acct.username, acct.password, cardId);
        if ('error' in card) {
          setErr('card not found')
          return;
        }
        updateState(draft => {
          draft.this = card
        })
        setErr('')
      }
    };
    mount();
  } ,[])

  
  
  // console.log(JSON.stringify(card, null, 4))
  const card = state.this;
  return (
    err ?
      <div>{err}</div>
    :
      card ?
      <>
        <div> cardID: {card!.id}</div>
        <h1 style={{fontSize: 50}}> {card!.cardData.kanji}</h1>
        <div>
          reading: 
          {card!.cardData.reading}
        </div>
        <div>
          other readings: 
          {card!.cardData.readingOther}
        </div>
        <div>definitions:</div>
        <EditTextarea 
          name='definitions'
          style={{border: '1px solid black'}}
          value={card!.cardData.definitions}
          onChange={(e) => {
            updateState(draft => {
              draft.this!.cardData.definitions = e.target.value;
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
            card!.cardData.exampleSentences.map(s => {
              return <div style={{border: '1px solid black', paddingLeft: '0.5em', paddingRight: '0.5em', margin: '1em'}}>{s.eng}</div>
            })
          }
        </div>
      </>
      :
      <div>here</div>
  )
}


function WordView() {
  // given a word
  //   get all cards made for that word. Turn these into 'pages' for ease of display
  //   if no cards, create new card based on dictionary entry
  //   {word} : {word: Word}
  const authContext = useContext(AuthContext)
  const acct = authContext.account as Account;
  interface Page {
    card?: Card
    newCard?: boolean
    onPage: boolean
  }
  const { wordId } = useParams();
  const [pages, setPages] = useState<Page[]>([])
  const [err, setErr] = useState('xxx') // on bootup, if everything goes fine, show the page
  const navigate = useNavigate();

  useEffect(() => {
    async function mount() {
      if (!wordId) {
        window.alert('wordID not found')
        // setPages([{error: 'wordID not found', onPage: true}])
        setErr('loading...');
        return;
      }

      const word = await getWord(acct.username, acct.password, wordId);
      if ('error' in word) {
        window.alert('wordID not found')
        // setPages([{error: 'wordID not found', onPage: true}])
        setErr('wordID invalid')
        return;
      }
      
      const cards = await getCardsForWord(acct.username,acct.password, wordId)
      if ('error' in cards) {
        setErr('couldn\'t fetch cards')
        return;
      }

      if (cards.length > 0) {
        const pages = cards.map((c, i) => {
          return {
            card: c,
            onPage: false,
          }
        })
        pages[0].onPage = true
        navigate(pages[0].card.id);
        setPages(pages);
        setErr('')
      } else {
        // direct user to creating a new card
        // add a 'card creation page'
        setPages([{newCard: true, onPage: true}])
        navigate("new");
        setErr('')
      }
    }
    mount()
  }, [wordId])

  return (
    <>
      {
        err ? 
          <div>{err}</div>
        :
          <>
            <div style={{display: 'flex', alignItems: 'center', border: '1px solid black', minWidth: '5em', margin: '1em'}}>
              {
                pages.map((page, i) => {
                  let style : React.CSSProperties;
                  if (page.onPage) {
                    style = {border: '1px solid black', paddingLeft: '0.5em', paddingRight: '0.5em', margin: '1em', textWrap: 'nowrap', backgroundColor: 'limegreen'}
                  } else {
                    style = {border: '1px solid black', paddingLeft: '0.5em', paddingRight: '0.5em', margin: '1em', backgroundColor: 'whitesmoke', textWrap: 'nowrap'}
                  }

                  let f;
                  let text;
                  if (page.card) {
                    let a = page.card.id;
                    f = () => navigate(a);
                    text = (i + 1);
                  } else {
                    f = () => navigate("new")
                    text = "new card"
                  }

                  return (
                    <div style={style} onClick={(e) => f()}>
                      {text}
                    </div>
                  )
                })
              }
            </div>
            <Routes>
              <Route path=":cardId" element={<CardEditor wordId={wordId!}/>} />
            </Routes>
          </>
      }
      
    </>
  )
}

export function NewWords() {
  interface SubPage {
    word: Word
    selected: boolean
  }

  const authContext = useContext(AuthContext)
  const acct = authContext.account as Account;
  const [subpages, setSubpages] = useState<SubPage[]>([])
  const navigate = useNavigate();

  useEffect(() => {
    async function onMount() {
      const words = await getNewWordsList(acct.username, acct.password, 'HIGHEST PRIO', Date.now());
      console.log(words);
      if ('error' in words) {
        window.alert(words.error);
        return;
      }
      const subpages = words.map(w => {
        return {
          word: w,
          selected: false
        };
      })
      setSubpages(subpages)
    }
    onMount()
  }, [])

  // 1. go onto /new-words link
  // 2. get list of new words. This will be a list of links

  return (
    <>
      <h1>learn new words</h1>
      <div style={{display: 'flex', minHeight: '90vh', border: '1px solid red'}}>
        {/* links to the words. Generated upon input*/}
        <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column', border: '1px solid black', minWidth: '5em', margin: '1em'}}>
          {
            subpages.length > 0 ?
              subpages.map(subpage => {
                let style : React.CSSProperties;
                if (subpage.selected) {
                  style = {border: '1px solid black', paddingLeft: '0.5em', paddingRight: '0.5em', margin: '1em', textWrap: 'nowrap', backgroundColor: 'limegreen'}
                } else {
                  style = {border: '1px solid black', paddingLeft: '0.5em', paddingRight: '0.5em', margin: '1em', backgroundColor: 'whitesmoke', textWrap: 'nowrap'}
                }
                return (
                  <div key={subpage.word.id} style={style} onClick={(e) => {
                      const subpages_ = subpages.map(subpage_j => {
                        if (subpage.word.id == subpage_j.word.id) {
                          return {...subpage_j, selected: true}
                        }
                        return {...subpage_j, selected: false}
                      })
                      setSubpages(subpages_)
                      navigate(subpage.word.id)
                    }}>{subpage.word.kanji}
                  </div>
                )
              })
            :
              <div>no new words</div>
          }
        </div>
        <div style={{border: '1px solid black', width: '100%', margin: '1em', padding: '1em'}}>
          <Routes>
            <Route path=":wordId/*" element={<WordView />}/>
            <Route path="*" element={<div>word not found / please select a word</div>}/>
          </Routes>
        </div>
      </div>
    </>
  )
}

export function NewWords_() {
  const authContext = useContext(AuthContext);
  return (
    authContext.account ? <NewWords/> : <div>you must login to access this feature</div>
  )
}