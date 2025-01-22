import { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { Link, redirectDocument, Route, Routes, useParams, useSearchParams } from "react-router-dom";
import { addCustomSentenceForWord, createCard, deleteCard, getCardsForWord, getCustomSentencesForWord, getExampleSentencesForWord, getWord, updateCard } from "./service/requestHelper";
import { Account, Card, CardData, CardType, checkSentenceInput, ExampleSentence, Word } from "../../global";
import { TimeContext } from "./context/TimeContextProvider";
import { EditText, EditTextarea } from "react-edit-text";
import { Typeahead } from "react-bootstrap-typeahead";
import Form from 'react-bootstrap/Form'
import { log } from "node:console";
import { useImmer } from "use-immer";
import { SentenceListItem } from "./WordDetails";
import { A } from "./A";

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

/**
 * assume input is valid
 */
async function getVocabCard(word: Word, acct: Account, timestamp: number) {
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
    cardType: 'VOCAB',
    knownLevel: 0,
    lastReviewed: null,
    timeDue: new Date(currTimestamp + 1800 * 1000), // due half an hour from now
    dateAdded: new Date(currTimestamp)
  }
  return newCard
}

/**
 * assume input is valid. Do prechecks before creation
 */
async function getSentenceCard(word: Word, sentence: ExampleSentence, acct: Account, timestamp: number) {
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
      exampleSentences: [sentence]
    },
    cardType: 'VOCAB',
    knownLevel: 0,
    lastReviewed: null,
    timeDue: new Date(currTimestamp + 1800 * 1000), // due half an hour from now
    dateAdded: new Date(currTimestamp)
  }
  return newCard
}


// async function getCardFromWord(word: Word, acct: Account, cardType: CardType, timestamp: number) {
//   // get example sentence on card and add it if it exists
//   const allSentences = await fetchSentences(acct, word)
//   const currTimestamp = timestamp;
//   const newCard : Card = {
//     id: 'new',
//     accountId: acct.id,
//     wordId: word.id,
//     cardData: {
//       entrySeq: word.entrySeq,
//       kanji: word.kanji,
//       kanjiOther: word.kanjiOther.join(', '),
//       reading: word.reading,
//       readingOther: word.readingOther.join(', '),
//       definitions: word.definitions.map((def, i) => `${i + 1}. ${def.glosses.join(';')}. ${def.positions.join(', ')}`).join('\n'),
//       exampleSentences: allSentences.slice(0, 1)
//     },
//     cardType: cardType,
//     knownLevel: 0,
//     lastReviewed: null,
//     timeDue: new Date(currTimestamp + 1800 * 1000), // due half an hour from now
//     dateAdded: new Date(currTimestamp)
//   }
//   return newCard
// }

function Fields({kanji_inp, setKanji_inp, reading_inp, setReading_inp, definitions_inp, setDefinitions_inp} :
                { kanji_inp: string, 
                  setKanji_inp: (v: string) => void,
                  reading_inp: string,
                  setReading_inp: (v: string) => void,
                  definitions_inp: string,
                  setDefinitions_inp: (v: string) => void,
                }) {

  return (
    <>
      <h3>fields</h3>
      <button>reset</button>
      <div>
        <label>kanji:</label>
        <input type='text' value={kanji_inp} onChange={(e) => {setKanji_inp(e.target.value);}}></input>
      </div>
      <div>
        <label>reading:</label>
        <input type='text' value={reading_inp} onChange={(e) => {setReading_inp(e.target.value);}}></input>
      </div>
      <div>
        <label>definition: </label>
        <EditTextarea
          style={{border: '1px solid black'}}
          value={definitions_inp}
          onChange={(e) => {setDefinitions_inp(e.target.value);}}
        />
      </div>
    </>
  )
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
    newCard.cardData.exampleSentences = structuredClone(sentencePool);
    return newCard;
  }

  async function saveCardToDatabase() {
    let newCard = generateNewCard();
    const res = await updateCard(acct.username, acct.password, card.id, newCard);
    if ('error' in res) {
      window.alert('error in saving card')
      return false;
    }
    setCard(res)
    // window.alert('card successfully saved')
    console.log('saved card');
    return true;
  }

  async function onMount() {
    const allSentences = await fetchSentences(acct, word);
    setAvaliableSentences(allSentences);
  }

  function inSentencePool(s: ExampleSentence) {
    return sentencePool.find(poolSentence => poolSentence.id == s.id) != null
  }

  function updateCardFrontend() {
    // console.log('update pagestate');
    let newCard = generateNewCard();
    setCard(newCard)
  }

  // update appearance when anything changes
  useEffect(() => {
    updateCardFrontend()
  }, [kanji_inp, reading_inp, definitions_inp, avaliableSentences, sentencePool])

  useEffect(() => {
    // get all sentences for all word (custom and original)
    onMount()
  }, [])

  return (
    <>
      <Fields
        kanji_inp={kanji_inp}
        setKanji_inp={setKanji_inp}
        definitions_inp={definitions_inp}
        setDefinitions_inp={setDefinitions_inp}
        reading_inp={reading_inp}
        setReading_inp={setReading_inp}
        // saveCardToDatabase={saveCardToDatabase}
      />
      <h3>example sentences</h3>
        <div><b>sentence pool</b></div>
        A random example sentence will be drawn from the following pool:
        <div style={{border: '1px solid black', padding: '1em'}}>
          {
            sentencePool.map(s => {
              return (
                <SentenceListItem key={s.id} sentence={s} showDeleteButton={true} onDelete={() => {
                  setSentencePool(sentencePool.filter(poolSentence => poolSentence.id != s.id))
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
          <button onClick={async () => {
            let res = await saveCardToDatabase()
            if (res) {
              window.alert('card successfully saved')
            }
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

function SentenceCard({cardOnPageHasSentence, navToCardWithSentence, card, word, setCard, onCardDelete} : {cardOnPageHasSentence: (s:ExampleSentence) => boolean, navToCardWithSentence: (s:ExampleSentence) => void, card: Card, word: Word, setCard: (newCard: Card) => void, onCardDelete: () => void}) {
  const authContext = useContext(AuthContext);
  const acct = authContext.account!
  const cardData = card.cardData;

  const [kanji_inp, setKanji_inp] = useState(cardData.kanji)
  const [reading_inp, setReading_inp] = useState(cardData.reading)
  const [definitions_inp, setDefinitions_inp] = useState(cardData.definitions)

  const [avaliableSentences, setAvaliableSentences] = useState<ExampleSentence[]>()
  const [sentenceOnCard, setSentenceOnCard] = useState<ExampleSentence | undefined>(card.cardData.exampleSentences[0])

  // update appearance when anything changes
  useEffect(() => {
    updateCardFrontend()
  }, [kanji_inp, reading_inp, definitions_inp, avaliableSentences, sentenceOnCard])


  function generateNewCard() {
    // console.log(sentenceOnCard);
    let newCard = structuredClone(card);
    newCard.cardData.kanji = kanji_inp;
    newCard.cardData.reading = reading_inp;
    newCard.cardData.definitions = definitions_inp;
    newCard.cardData.exampleSentences = sentenceOnCard ? [structuredClone(sentenceOnCard)] : []
    // console.log(newCard);
    return newCard;
  }
  /**
   * so when we come back to this page, the card is still there
   */
  function updateCardFrontend() {
    // console.log('update pagestate');
    
    let newCard = generateNewCard();
    setCard(newCard)
  }

  async function saveCardToDatabase() {
    let newCard = generateNewCard();
    const res = await updateCard(acct.username, acct.password, card.id, newCard);
    if ('error' in res) {
      window.alert('error in saving card')
      return false;
    }
    setCard(res)
    console.log('card saved');
    return true;
  }

  async function onMount() {
    if (!avaliableSentences) {
      const allSentences = await fetchSentences(acct, word);
      setAvaliableSentences(allSentences);
    }

    // console.log(cardData);
  }

  useEffect(() => {
    onMount()
  }, [])


  return (
    <>
      <h3>sentence</h3>
      <div><b>selected sentence:</b></div>
      {
        sentenceOnCard ?
        <SentenceListItem sentence={sentenceOnCard}/>
        :
        <div>this card appears to have no sentence.</div>
      }
      <div><b>avaliable sentences</b></div>
      Other avaliable sentences. Click here to 
      <Link target='_blank' to={`/word-details/?wordId=${word.id}`}> manage avaliable sentences.</Link>
      
      <div style={{border: '1px solid black', padding: '0.5em', marginBottom: '1em'}}>
        filter: <input type='text' ></input> 
      </div>
      
      <div style={{border: '1px solid black', padding: '1em'}}>
        {
          avaliableSentences ?
            avaliableSentences.length > 0 ?
              avaliableSentences.filter(s => !sentenceOnCard || s.id != sentenceOnCard.id).map(s => {
                return (
                  <SentenceListItem 
                    sentence={s} 
                    extraButtons={[
                      <button onClick={() => {
                        if (cardOnPageHasSentence(s)) {
                          if (window.confirm('there is already a sentence card for this word with this sentence. Go to card?')) {
                            navToCardWithSentence(s)
                          }
                          return;
                        }
                        setSentenceOnCard(s)
                      }}>
                      select
                      </button>
                    ]}
                  />
                )
              })
            :
            <div>no sentences found for this word</div>
          :
          <div>fetching...</div>
        }
      </div>

      <Fields
        kanji_inp={kanji_inp}
        setKanji_inp={setKanji_inp}
        definitions_inp={definitions_inp}
        setDefinitions_inp={setDefinitions_inp}
        reading_inp={reading_inp}
        setReading_inp={setReading_inp}
      />

      <div style={{display: 'flex', justifyContent: 'center'}}>
        <div>
          <button onClick={async () => {
            let res = await saveCardToDatabase()
            if (res) {
              window.alert('card successfully saved')
            }
            
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


function CardEditor({cardOnPageHasSentence, navToCardWithSentence, cardsOnPage, card, word, setCard, onCardDelete} : 
  {cardOnPageHasSentence: (s:ExampleSentence) => boolean, navToCardWithSentence: (s:ExampleSentence) => void, cardsOnPage: Card[], card: Card, word: Word, setCard: (newCard: Card) => void, onCardDelete: () => void}) {  
  return (
    <>
      <div style={{padding: '1em'}}>
        <h1>card editor</h1>
        <div>date added: {card.dateAdded.toString()}</div>
        <div>last reviewed: {card.lastReviewed ? card.lastReviewed.toString() : 'never'} </div>
        <div>known level of card: {card.knownLevel}</div>
        <div>cardId: {card.id}</div>
        {
          card.cardType == 'VOCAB' ? 
            <VocabCard key={card.id} card={card} word={word} setCard={setCard} onCardDelete={onCardDelete}/>
            :
            <SentenceCard cardOnPageHasSentence={cardOnPageHasSentence} navToCardWithSentence={navToCardWithSentence} key={card.id} card={card} word={word} setCard={setCard} onCardDelete={onCardDelete}/>
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

  const autoCreate = searchParams.get('autoCreate') ? Boolean(searchParams.get('autoCreate')) : false
  const autoCreateR = useRef(autoCreate);

  const setCardIdx = (v: number) => setSearchParams(old => {
    old.set('cardIdx', v.toString());
    return old
  });

  const [word, setWord] = useState<Word | null>();
  const [cards, setCards] = useState<Card[]>();
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
    
    if (autoCreate && autoCreateR.current) {
      autoCreateR.current = false; // combat strict mode :(. Make sure thing runs exactly once.
      // components own refs and stuff are not updated on rerenders, unless forced
      if (checkCanCreateVocabCard(fetchedCards)) {
        await onCreateVocabCard(fetchedCards, fetchedWord);
      }
      setCardIdx(0)
      
    }
  };



  function cardOnPageHasSentence(s: ExampleSentence) {
    for (let card of cards!) {
      if (card.cardType == 'SENTENCE' &&
          card.cardData.exampleSentences.length > 0 &&
          card.cardData.exampleSentences[0].id == s.id) 
      {
        return true;
      }
    }
    return false;
  }

  function navToCardWithSentence(s: ExampleSentence) {
    let newIdx = cards!.findIndex(card => {
      return card.cardType == 'SENTENCE' &&
      card.cardData.exampleSentences.length > 0 &&
      card.cardData.exampleSentences[0].id == s.id
    })
    console.log(s);
    console.log(cards);
    console.log(newIdx);
    setCardIdx(newIdx)
  }

  async function createVocabCardAndUpdate(wordS: Word, cardsS: Card[]) {
    const newCard = await getVocabCard(wordS, acct, timeContext.getCurrentTimestamp());
    const createdCard = await createCard(acct.username, acct.password, newCard, 'VOCAB');
    if ('error' in createdCard) {
      window.alert('couldn\'t create card')
      return;
    }
    setCards(cardsS.concat(createdCard));
    setCardIdx((cardsS.length))
  }

  function checkCanCreateVocabCard(cardsS: Card[]) {
    return cardsS.filter(card => card.cardType == 'VOCAB').length <= 0;
  }

  /**
   * assume cards is not null
   * @returns 
   */
  async function onCreateVocabCard(cardsS: Card[], wordS: Word) {
    setShowTmp(true)
    if (!checkCanCreateVocabCard(cardsS)) {
      window.alert('You may only have at most one vocab card for a word.')
      setShowTmp(false)
      return;
    }
    await createVocabCardAndUpdate(wordS, cardsS);
    setShowTmp(false)
  }


  async function createSentenceCardAndUpdate(sentence: ExampleSentence) {
    const newCard = await getSentenceCard(word!, sentence, acct, timeContext.getCurrentTimestamp());
    const createdCard = await createCard(acct.username, acct.password, newCard, 'SENTENCE');
    if ('error' in createdCard) {
      window.alert('couldn\'t create card')
      return;
    }
    setCards(cards!.concat(createdCard));
    setCardIdx((cards!.length))
  }

  /**
   * assume word is not null
   * @returns 
   */
  async function onCreateSentenceCard() {
    setShowTmp(true)
    let allSentences = await fetchSentences(acct, word!);
    // create card with next unknown sentence
    // if no more, then return
    const takenSentenceIds = cards!.filter(card => card.cardType == 'SENTENCE').flatMap(card => card.cardData.exampleSentences).map(s => s.id)
    const nxtSentence = allSentences.find(s => !(takenSentenceIds.includes(s.id)))
    if (!nxtSentence) {
      setShowTmp(false)
      window.alert('You have a card for every avaliable sentence already.')
      return;
    }
    await createSentenceCardAndUpdate(nxtSentence)
    setShowTmp(false)
  }

  useEffect(() => {
    fetchAndSet()
  }, [wordId])

  const [showTmp, setShowTmp] = useState(false);
  
  return (
    <>
      {
        word ?
          cards ?
          <div style={{border: '1px solid red', minHeight: '30vh', padding:'1em', display: 'flex'}}>
            
            <div style={{border: '1px solid black', padding: '0.5em', minWidth: '15em', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between'}}>
              {/* left bar */} 
              <div style={{width: '100%'}}>
                {/* card list*/}
                {
                  cards.length > 0 ?
                    cards.map((card, i) => {
                      return (
                        <div key={card.id} style={{border: '1px solid black', width: '100%', backgroundColor: cardIdx === i ? 'limegreen' : (card.cardType == 'VOCAB' ? 'whitesmoke' : 'beige')}}
                          onClick={() => {
                            setCardIdx(i)
                          }}
                        >
                        {card.cardData.kanji} {i + 1} ({card.cardType.toLowerCase()} card)
                        </div>
                      )
                    })
                  :
                    <div>No cards. Create one below.</div>    
                }
                {
                  showTmp &&
                  <div key='abcd' style={{border: '1px solid black', width: '100%', backgroundColor: 'skyblue'}}>
                    creating...
                  </div>
                }

              </div>
              <div style={{border: '1px solid black', width: '100%'}}> 
                <button style={{width: '100%'}} onClick={() => onCreateVocabCard(cards, word)}>+ new vocab card</button>
                <button style={{width: '100%'}} onClick={onCreateSentenceCard}>+ new sentence card</button>
              </div>
            </div>
            <div style={{border: '1px solid black', width: '100%'}}>
              {
                displayedCard ?
                <CardEditor cardOnPageHasSentence={cardOnPageHasSentence} navToCardWithSentence={navToCardWithSentence} cardsOnPage={cards} card={displayedCard} word={word} setCard={(newCard) => {
                  const newCards = cards.slice(0, cardIdx).concat(newCard).concat(cards.slice(cardIdx + 1))
                  setCards(newCards)
                  // cards[cardIdx] = newCard
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
