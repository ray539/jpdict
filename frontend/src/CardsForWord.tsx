import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { Link, Route, Routes, useParams, useSearchParams } from "react-router-dom";
import { addCustomSentenceForWord, createCard, deleteCard, getCardsForWord, getCustomSentencesForWord, getExampleSentencesForWord, getWord, updateCard } from "./service/requestHelper";
import { Account, Card, CardData, CardType, checkSentenceInput, ExampleSentence, Word } from "../../global";
import { TimeContext } from "./context/TimeContextProvider";
import { EditText, EditTextarea } from "react-edit-text";
import { Typeahead } from "react-bootstrap-typeahead";
import Form from 'react-bootstrap/Form'
import { log } from "node:console";
import { useImmer } from "use-immer";
import { SentenceListItem } from "./WordDetails";

// EXAMPLE SENTENCES: OLD
{/* <div>
<div>example sentence:</div>
<Link target='_blank' to={`/word-details/?wordId=${word.id}`}>edit avaliable sentences</Link>
<div>
  <input type='checkbox' checked={selectFromExisting} onChange={(e) => {
    setSelectFromExisting(!selectFromExisting)}
  }>
  </input> select from existing
</div>
<div>
  <input type='checkbox' checked={!selectFromExisting} onChange={(e) => {
    setSelectFromExisting(!selectFromExisting)}
  }></input> create new
</div>

</div>
{
selectFromExisting ?
<div>
    JPN:
    <Form.Select value={sentence_inp1 ? sentence_inp1.id : ''} onChange={(e) => {
      e.preventDefault();
      const fnd = avaliableSentences.find(s => (s.id === e.target.value))
      setSentence_inp1(fnd)
    }}>
      {
        avaliableSentences.map(s => {
          return (
            <option value={s.id} key={s.id} style={{backgroundColor: s.custom ? 'beige' : 'white'}}>
              {s.jpn} {s.custom ? ' (custom sentence)' : ''}
            </option>
          )
        })
      }
    </Form.Select>
    ENG:
    <Form.Control style={{marginBottom: '2em'}} disabled value={sentence_inp1 ? sentence_inp1.eng : ''}></Form.Control>
</div>
:
<div>
  <Form onSubmit={async (e) => {
    e.preventDefault();
    let checkOutput = checkSentenceInput(sentence_inp2.jpn, word)
    if ('error' in checkOutput) {
      window.alert(checkOutput.error)
      return;
    }
    const foundWordForm = checkOutput.foundWordForm;
    updateSentence_inp2(old => {
      old.default_word_wordForm = foundWordForm;
    })
    await addCustomSentenceForWord(acct.username, acct.password, word.id, sentence_inp2.jpn, sentence_inp2.eng, foundWordForm);
    await fetchSentences(acct, word)
    window.alert('your sentence is valid, and has been added to the database.')
  }}
  >
    <div>JPN:</div>
    <Form.Control value={sentence_inp2.jpn} onChange={(e) => {
      updateSentence_inp2(old => {
        old.jpn = e.target.value
      })
    }}/>
    <div>ENG:</div>
    <Form.Control value={sentence_inp2.eng} onChange={(e) => {
      updateSentence_inp2(old => {
        old.eng = e.target.value
      })
    }}/>
    <button>check sentence</button>
  </Form>
</div>
} */}

async function fetchSentences(acct: Account, word: Word) {
  // get example sentence on card and add it if it exists
  let fetchedSentences1 = await getExampleSentencesForWord(acct.username, acct.password, word.id);
  let sentences1 : ExampleSentence[];
  if ('error' in fetchedSentences1) {
    window.alert('couldn\'t fetch sentences')
    sentences1 = []
  } else {
    sentences1 = fetchedSentences1;
  }

  let fetchedSentences2 = await getCustomSentencesForWord(acct.username, acct.password, word.id);
  let sentences2: ExampleSentence[];
  if ('error' in fetchedSentences2) {
    window.alert('couldn\'t fetch sentences')
    sentences2 = []
  } else {
    sentences2 = fetchedSentences2;
  }
  sentences2.reverse()
  const allSentences = sentences2.concat(sentences1);
  return allSentences
}

// https://ericgio.github.io/react-bootstrap-typeahead/
// https://github.com/ericgio/react-bootstrap-typeahead?tab=readme-ov-file
async function getCardFromWord(word: Word, acct: Account, cardType: CardType, timestamp: number) {
  // get example sentence on card and add it if it exists
  const allSentences = await fetchSentences(acct, word)
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
      exampleSentences: allSentences.slice(0, 1)
    },
    cardType: cardType,
    knownLevel: 0,
    lastReviewed: null,
    timeDue: new Date(currTimestamp + 1800 * 1000), // due half an hour from now
    dateAdded: new Date(currTimestamp)
  }
  return newCard
}

function VocabCard({card, word, setCard, onCardDelete} : {card: Card, word: Word, setCard: (newCard: Card) => void, onCardDelete: () => void}) {
  const authContext = useContext(AuthContext);
  const acct = authContext.account!
  const cardData = card.cardData;
  const [kanji_inp, setKanji_inp] = useState(cardData.kanji)
  const [reading_inp, setReading_inp] = useState(cardData.reading)
  const [definitions_inp, setDefinitions_inp] = useState(cardData.definitions)

  const [avaliableSentences, setAvaliableSentences] = useState<ExampleSentence[]>([])
  const [sentencePool, setSentencePool] = useImmer<ExampleSentence[]>(card.cardData.exampleSentences)
  
  function generateNewCard() {
    let newCard = structuredClone(card);
    newCard.cardData.kanji = kanji_inp;
    newCard.cardData.reading = reading_inp;
    newCard.cardData.definitions = definitions_inp;
    newCard.cardData.exampleSentences = structuredClone(sentencePool)
    return newCard;
  }
  /**
   * so when we come back to this page, the card is still there
   */
  function updateCardFrontend() {
    let newCard = generateNewCard();
    setCard(newCard)
  }

  async function saveCardToDatabase() {
    let newCard = generateNewCard();
    const res = await updateCard(acct.username, acct.password, card.id, newCard);
    if ('error' in res) {
      window.alert('error in saving card')
      return;
    }
    setCard(res)
    window.alert('card successfully saved')
  }

  async function onMount() {
    const allSentences = await fetchSentences(acct, word);
    setAvaliableSentences(allSentences);
  }

  function inSentencePool(s: ExampleSentence) {
    return sentencePool.find(poolSentence => poolSentence.id == s.id) != null
  }

  useEffect(() => {
    // get all sentences for all word (custom and original)
    onMount()
  }, [])

  return (
    <>
      <h3>fields</h3>
      <button>reset</button>
      <div>
        <label>kanji:</label>
        <input type='text' value={kanji_inp} onChange={(e) => {setKanji_inp(e.target.value); updateCardFrontend()}}></input>
      </div>
      <div>
        <label>reading:</label>
        <input type='text' value={reading_inp} onChange={(e) => {setReading_inp(e.target.value); updateCardFrontend}}></input>
      </div>
      <div>
        <label>definition: </label>
        <EditTextarea
          style={{border: '1px solid black'}}
          value={definitions_inp}
          onChange={(e) => {setDefinitions_inp(e.target.value); updateCardFrontend()}}
        />
      </div>

      <h3>example sentences</h3>
        <div><b>sentence pool</b></div>
        A random example sentence will be drawn from the following pool:
        <div style={{border: '1px solid black', padding: '1em'}}>
          {
            sentencePool.map(s => {
              return (
                <SentenceListItem key={s.id} sentence={s} showDeleteButton={true} onDelete={() => {
                  setSentencePool(sentencePool.filter(poolSentence => poolSentence.id != s.id))
                  updateCardFrontend();
                }}/>
              )
            })
          }
        </div>

      <div><b>avaliable sentences</b></div>
      Other avaliable sentences. Click here to 
      <Link target='_blank' to={`/word-details/?wordId=${word.id}`}> manage avaliable sentences.</Link>
      
      <div style={{border: '1px solid black', padding: '0.5em', marginBottom: '1em'}}>
        filter: <input type='text' ></input> 
      </div>
      
      <div style={{border: '1px solid black', padding: '1em'}}>
        {
          avaliableSentences.filter(s => !inSentencePool(s)).map(s => {
            return (
              <SentenceListItem 
                sentence={s} 
                extraButtons={[
                  <button onClick={() => {
                    setSentencePool(sentencePool.concat([s]))
                    updateCardFrontend();
                  }}>
                  +
                  </button>
                ]}
              />
            )
          })
        }
      </div>
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <div>
          <button onClick={() => {
            saveCardToDatabase();
          }}>save changes</button>
        </div>
        <div>
          <button>preview card</button>
        </div>
        <div>
          <button style={{backgroundColor: 'pink'}} onClick={() => onCardDelete()}>delete card</button>
        </div>
      </div>      
    </>
  )
}

function SentenceCard({card, word, setCard, onCardDelete} : {card: Card, word: Word, setCard: (newCard: Card) => void, onCardDelete: () => void}) {
  const authContext = useContext(AuthContext);
  const acct = authContext.account!
  const cardData = card.cardData;
  const [kanji_inp, setKanji_inp] = useState(cardData.kanji)
  const [reading_inp, setReading_inp] = useState(cardData.reading)
  const [definitions_inp, setDefinitions_inp] = useState(cardData.definitions)

  const [avaliableSentences, setAvaliableSentences] = useState<ExampleSentence[]>([])
  const [sentenceOnCard, setSentenceOnCard] = useState<ExampleSentence>(card.cardData.exampleSentences[0])

  function generateNewCard() {
    let newCard = structuredClone(card);
    newCard.cardData.kanji = kanji_inp;
    newCard.cardData.reading = reading_inp;
    newCard.cardData.definitions = definitions_inp;
    newCard.cardData.exampleSentences = [structuredClone(sentenceOnCard)]
    return newCard;
  }
  /**
   * so when we come back to this page, the card is still there
   */
  function updateCardFrontend() {
    let newCard = generateNewCard();
    setCard(newCard)
  }

  async function saveCardToDatabase() {
    let newCard = generateNewCard();
    const res = await updateCard(acct.username, acct.password, card.id, newCard);
    if ('error' in res) {
      window.alert('error in saving card')
      return;
    }
    setCard(res)
    window.alert('card successfully saved')
  }

  async function onMount() {
    const allSentences = await fetchSentences(acct, word);
    setAvaliableSentences(allSentences);
  }
  useEffect(() => {
    onMount()
  }, [])

  return (
    <>
      <h3>sentence</h3>
      <div><b>selected sentence:</b></div>
      <SentenceListItem sentence={sentenceOnCard}/>
      <div><b>avaliable sentences</b></div>
      Other avaliable sentences. Click here to 
      <Link target='_blank' to={`/word-details/?wordId=${word.id}`}> manage avaliable sentences.</Link>
      
      <div style={{border: '1px solid black', padding: '0.5em', marginBottom: '1em'}}>
        filter: <input type='text' ></input> 
      </div>
      
      <div style={{border: '1px solid black', padding: '1em'}}>
        {
          avaliableSentences.filter(s => s.id != sentenceOnCard.id).map(s => {
            return (
              <SentenceListItem 
                sentence={s} 
                extraButtons={[
                  <button onClick={() => {
                    setSentenceOnCard(s)
                    updateCardFrontend();
                  }}>
                  select
                  </button>
                ]}
              />
            )
          })
        }
      </div>

      <h3>fields</h3>
      <button>reset</button>
      <div>
        <label>kanji:</label>
        <input type='text' value={kanji_inp} onChange={(e) => {setKanji_inp(e.target.value); updateCardFrontend()}}></input>
      </div>
      <div>
        <label>reading:</label>
        <input type='text' value={reading_inp} onChange={(e) => {setReading_inp(e.target.value); updateCardFrontend}}></input>
      </div>
      <div>
        <label>definition: </label>
        <EditTextarea
          style={{border: '1px solid black'}}
          value={definitions_inp}
          onChange={(e) => {setDefinitions_inp(e.target.value); updateCardFrontend()}}
        />
      </div>
    </>
    
  )
  
}


function CardEditor({card, word, setCard, onCardDelete} : {card: Card, word: Word, setCard: (newCard: Card) => void, onCardDelete: () => void}) {  


  return (
    <>
      <div style={{padding: '1em'}}>
        <h1>card editor</h1>
        <div>date added: {card.dateAdded.toString()}</div>
        <div>last reviewed: {card.lastReviewed ? card.lastReviewed.toString() : 'never'} </div>
        <div>known level of card: {card.knownLevel}</div>
        {
          card.cardType == 'VOCAB' ? 
            <VocabCard card={card} word={word} setCard={setCard} onCardDelete={onCardDelete}/>
            :
            <SentenceCard card={card} word={word} setCard={setCard} onCardDelete={onCardDelete}/>
        }
      </div>

    </>
  )
}

function CardsForWord() {
  const authContext = useContext(AuthContext);
  const timeContext = useContext(TimeContext)
  const acct = authContext.account!
  const [searchParams, setSearchParams] = useSearchParams();
  const wordId = searchParams.get('wordId')
  const cardIdx = searchParams.get('cardIdx') ? Number(searchParams.get('cardIdx')) : -1
  const setCardIdx = (v: number) => setSearchParams(old => {
    old.set('cardIdx', v.toString());
    return old
  });

  const [word, setWord] = useState<Word | null>();
  const [cards, setCards] = useState<Card[] | null> ();

  let displayedCard : Card | undefined;
  if (cards != null && cards.length > 0 && cardIdx >= 0 && cardIdx < cards.length) {
    displayedCard = cards[cardIdx]
  }

  async function deleteCardAtCardIdx() {
    if (!displayedCard) {
      return;
    }
    const res = await deleteCard(acct.username, acct.password, displayedCard.id)
    if ('error' in res) {
      window.alert('couldn\'t delete card')
      return;
    }
    setCards(cards!.filter(c => c.id != displayedCard.id))
  }


  async function fetchAndSet() {
    if (!wordId) {
      return;
    }
    const fetchedWord = await getWord(acct.username, acct.password, wordId)
    if ('error' in fetchedWord) {
      window.alert('couldn\'t fetch word')
      return;
    }
    setWord(fetchedWord)
    const fetchedCards = await getCardsForWord(acct.username, acct.password, wordId);
    if ('error' in fetchedCards) {
      window.alert('couldn\'t fetch cards')
      return;
    }
    setCards(fetchedCards)
  };

  async function createCardAndUpdate(cardType: CardType) {
    const newCard = await getCardFromWord(word!, acct, cardType, timeContext.getCurrentTimestamp());
    const createdCard = await createCard(acct.username, acct.password, newCard, cardType);
    if ('error' in createdCard) {
      window.alert('couldn\'t create card')
      return;
    }
    setCards(cards!.concat(createdCard));
    setCardIdx((cards!.length))
  }



  useEffect(() => {
    fetchAndSet()
  }, [wordId, cardIdx])
  
  return (
    <>
      {
        word ?
          cards ?
          <div style={{border: '1px solid red', minHeight: '30vh', padding:'1em', display: 'flex'}}>
            
            <div style={{border: '1px solid black', padding: '0.5em', minWidth: '15em', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between'}}>
              {/* left bar */}
              {
                cards.length > 0 ?
                
                <div style={{width: '100%'}}>
                  {/* card list*/}
                  {
                    cards.map((card, i) => {
                      return (
                        <div key={card.id} style={{border: '1px solid black', width: '100%', backgroundColor: cardIdx === i ? 'limegreen' : (card.cardType == 'VOCAB' ? 'whitesmoke' : 'beige')}}
                          onClick={(e) => {
                            setCardIdx(i)
                          }}
                        >
                        {card.cardData.kanji} {i + 1} ({card.cardType.toLowerCase()} card)
                        </div>
                      )
                    })
                  }
                </div>
                :
                <div>No cards. Create one below.</div>    
              }
              <div style={{border: '1px solid black', width: '100%'}}> 
                <button style={{width: '100%'}} onClick={async () => {
                  createCardAndUpdate('VOCAB')
                }}>+ new vocab card</button>
                <button style={{width: '100%'}} onClick={() => {
                  createCardAndUpdate('SENTENCE')
                }}>+ new sentence card</button>
              </div>
            </div>
            <div style={{border: '1px solid black', width: '100%'}}>
              {
                displayedCard ?
                <CardEditor card={displayedCard} word={word} setCard={(newCard) => {
                  cards[cardIdx] = newCard
                }} onCardDelete={() => {
                  if (window.confirm('Delete card?')) {
                    deleteCardAtCardIdx()
                  }
                  
                }} />
                :
                <div>select a card to display it</div>
              }
            </div>
          </div>
          :
          <div>fetching cards...</div>
        :
        <div>fetching words...</div>
      }
    </>
  )
}

export function CardsForWord_() {
  const authContext = useContext(AuthContext);
  
  return (
    authContext.account ? 
    <CardsForWord />
    :
    <div>you must log in to use this feature</div>
  )
}
