import { useContext, useEffect, useState } from "react"
import { Card, ExampleSentence, getRandomIntInclusive } from "../../global"
import { changeWordKnownLevel, getCardsForWord, getDueCards, updateCard } from "./service/requestHelper"
import { AuthContext } from "./context/AuthContextProvider"
import { Updater, useImmer } from "use-immer"
import { useNavigate } from "react-router-dom"
import { TimeContext } from "./context/TimeContextProvider"
import { SentenceListItem } from "./WordDetails"
import { Container, Card as Card_b, Stack, Button } from "react-bootstrap"

const CARD: Card = {
  "id": "0d6a8aca-88bc-462a-a9b6-47172bc37fad",
  "accountId": "4130041f-cdd0-4ae3-9d06-aac61e45dc9d",
  "wordId": "00e48c0e-4c41-4a68-9782-cf5834458b57",
  cardType: 'SENTENCE',
  "cardData": {
    "kanji": "部門",
    "reading": "ぶもん",
    "entrySeq": "1499540",
    "kanjiOther": "",
    "definitions": "1. division (of a larger group);branch;field;class (subclass);group;category;department. noun (common) (futsuumeishi), nouns which may take the genitive case particle 'no'\n2. def 2\n3. def 3",
    "readingOther": "",
    "exampleSentences": [
      {
        "id": "838549c1-69a9-4760-852c-7ff60b4f2e4e",
        "eng": "History is a branch of the humanities.",
        "jpn": "歴史学は人文科学の一部門である。",
        "default_wordId": "00e48c0e-4c41-4a68-9782-cf5834458b57",
        "default_word_wordForm": "部門",
        custom: true
      }
    ]
  },
  "knownLevel": 0,
  "lastReviewed": null,
  "timeDue": (new Date("2024-12-12T02:05:09.115Z")),
  "dateAdded": (new Date("2024-12-12T01:35:09.115Z")),
  easeFactor: 1.3,
  name: ""
}

function convertText(txt: string) {
  let res = []
  let currLine = ''
  let id = 0;
  for (let c of txt) {
    if (c === '\n') {
      res.push(currLine)
      currLine = ''
      res.push(<br key={id++}></br>)
    } else {
      currLine += c
    }
  }
  res.push(currLine)
  return res
}

export const SECOND = 1000;
export const MINUTE = 60 * SECOND
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR
export const WEEK = 7 * DAY
export function knownLevelDelayTime(knownLevel: number, easeFactor: number) : number {
  if (knownLevel == 0) {
    return 30 * SECOND; // 30 seconds
  } else if (knownLevel == 1) {
    return 1 * DAY
  } else if (knownLevel == 2) {
    return 6 * DAY
  } else {
    return easeFactor * knownLevelDelayTime(knownLevel - 1, easeFactor);
  }
}

function SentenceDisplay({sentence, jpnOnly = false} : {sentence: ExampleSentence, jpnOnly?: boolean}) {

  return (
    <div style={{fontSize: '20px', textAlign: 'center'}}>
      <div>{sentence.jpn}</div>
      {
        !jpnOnly &&
        <div>{sentence.eng}</div>
      }
      
    </div>
  )
}

function CardBack({card, height, onGrade = (q) => {}} : {card: Card, height: string, onGrade?: (q: number) => void}) {
  const authContext = useContext(AuthContext);
  const timeContext = useContext(TimeContext)
  const acct = authContext.account!;

  // const height = '80vh'
  return (
    <>
      <Card_b className='shadow'>
        <Card_b.Body>
          <div className='text-center' style={{minHeight: height, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <div>
              <h1 style={{fontSize: `calc(0.1 * ${height})`, marginTop: `calc(0.05 * ${height})`}}>
                <ruby>
                  {card.cardData.kanji}
                  <rt>{card.cardData.reading}</rt>
                </ruby>
              </h1>
              {
                card.cardData.readingOther &&
                <div>
                  other readings: {card.cardData.readingOther}
                </div>
              }
              {
                card.cardType == 'SENTENCE' ?
                  card.cardData.exampleSentences.length > 0 && <SentenceDisplay sentence={card.cardData.exampleSentences[0]}/>
                :
                  card.cardData.exampleSentences.length > 0 && <SentenceDisplay sentence={card.cardData.exampleSentences[getRandomIntInclusive(0, card.cardData.exampleSentences.length - 1)]} />
              }

              <div className='text-start'>
                <h4>definition(s)</h4>
                {convertText(card.cardData.definitions)}
                <br></br>
                <br></br>
                <br></br>
                (debug)
                <div>dueDate: {(new Date(card.timeDue)).toLocaleString()}</div>
                <div>lastReviewed: {card.lastReviewed ? (new Date(card.lastReviewed)).toLocaleString() : "null"}</div>
                <div>knownLevel: {card.knownLevel}</div>
                <div>easeLevel: {card.easeFactor}</div>
              </div>
            </div>

            <div style={{display: 'flex', justifyContent: 'center', marginBottom: `calc(0.1 * ${height})`}}>
              <Button
                variant='danger'
                onClick={() => onGrade(0)}
                className='me-2'
              >
                fail
              </Button>
              <Button
                variant='secondary'
                onClick={() => onGrade(1)}
                className='me-2'
              >
                difficult (but pass)
              </Button>
              <Button
                variant='success'
                onClick={() => onGrade(2)}
                className='me-2'
              >
                pass
              </Button>
              <Button
                variant='primary'
                onClick={() => onGrade(3)}
              >
                easy
              </Button>
            </div>
          </div>
        </Card_b.Body>
      </Card_b>
    </>
    
  )
}

function CardFront({card, height, onClickShowAnswer = () => {}} : {card: Card, height: string, onClickShowAnswer?: Function}) {
  // const card = pageState.cards![pageState.cIndx!].card;
  // const height = '80vh'
  return (
    <>
      <Card_b className='shadow'>
        <Card_b.Body>
          <div className='text-center' style={{minHeight: height, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <div>
              <h1 style={{fontSize: `calc(0.1 * ${height})`, marginTop: `calc(0.1 * ${height})`}}>{card.cardData.kanji}</h1>
              {
                card.cardType == 'SENTENCE' &&
                <SentenceDisplay sentence={card.cardData.exampleSentences[0]} jpnOnly/>
              }
            </div>
            <div>
              <Button
                variant='outline-success'
                onClick={() => onClickShowAnswer()}
                style={{
                  marginBottom: `calc(0.1 * ${height})`
                }}
              >
                show answer
              </Button>
            </div>
          </div>
        </Card_b.Body>

      </Card_b>
    </>

  )
}

/**
 * 
 * @param onGrade: what happens user finishes grading the card
 * @returns 
 */
export function CardView({card, showFront, height = '80vh', setShowFront, onGrade = (q) => {}} : {card: Card, showFront: boolean, height?: string, setShowFront: (v:boolean) => void, onGrade?: (q: number) => void}) {
  // const cardView = pageState.cards![pageState.cIndx!];
  return (
    showFront ?
      <CardFront card={card} height={height} onClickShowAnswer={() => setShowFront(false)}/>
    :
      <CardBack card={card}  height={height} onGrade={onGrade} />
  )
}

interface CardView {
  card: Card,
  front: boolean
}

interface PageState {
  cards?: CardView[]
  cIndx?: number
  // ending states:
  // - finished session, finished all cards
}

export function ReviewCards() {
  // onMount:
  // - get list of due cards
  // - go through all cards in that list
  const authContext = useContext(AuthContext);
  const timeContext = useContext(TimeContext)
  const acct = authContext.account!;
  // const [pageState, updatePageState] = useImmer<PageState>({});
  const [cardViews, updateCardViews] = useImmer<CardView[] | undefined>(undefined);
  const [cardIdx, setCardIdx] = useState<number>();

  let displayedCardView : CardView | undefined;
  if (cardViews != undefined && cardViews.length > 0 && cardIdx && cardIdx >= 0 && cardIdx < cardViews.length) {
    displayedCardView = cardViews[cardIdx]
  }
  
  const navigate = useNavigate();

  async function fetchAndDisplayDueCards() {
    const fetchedCards = await getDueCards(acct.username, acct.password, timeContext.getCurrentTimestamp(), 100);
    if ('error' in fetchedCards) {
      window.alert('can\'t fetch cards');
      return;
    }
    updateCardViews(fetchedCards.map(c => {return {card: c, front: true}}))
    setCardIdx(0);
  }
  useEffect(() => {
    fetchAndDisplayDueCards()
  }, []);
  console.log(cardViews);
  console.log(cardIdx);
  
  

  // q == 0: fail
  // q == 1: difficult pass
  // q == 2: pass
  // q == 3: easy pass

  async function onGradeCard(card: Card, q: number) {
    let d = (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02))
    let newEaseFactor = card.easeFactor + d;
    newEaseFactor = Math.max(newEaseFactor, 1.3);
    newEaseFactor = Math.min(newEaseFactor, 2.5);
    let newKnownLevel = q > 0 ? Math.min(8, card.knownLevel + 1) : 0
    console.log(newEaseFactor);
    console.log(newKnownLevel);

    let newCard = structuredClone(card) as Card;
    newCard.knownLevel = newKnownLevel;
    newCard.easeFactor = newEaseFactor;
    newCard.timeDue = new Date(timeContext.getCurrentTimestamp() + knownLevelDelayTime(newCard.knownLevel, newCard.easeFactor))
    newCard.lastReviewed = new Date(timeContext.getCurrentTimestamp());
    console.log(newCard);
    
    const updatedCard = await updateCard(acct.username, acct.password, newCard.id, newCard)
    if ('error' in updatedCard) {
      window.alert('couldn\'t update card')
      return;
    }

    const fetchedCardsForWord = await getCardsForWord(acct.username, acct.password, newCard.wordId);
    if ('error' in fetchedCardsForWord) {
      window.alert('couldn\'t fetch cards for word')
      return;
    }
    
    const wordKnownLevel = fetchedCardsForWord.map(c => c.knownLevel).reduce((c, n) => Math.max(c, n), 0)
    console.log(wordKnownLevel);

    // update word known level - this is the maximum known level of any card for that word
    const ret = await changeWordKnownLevel(acct.username, acct.password, newCard.wordId, wordKnownLevel);
    if ('error' in ret) {
      window.alert('couldn\'t change word known level')
      return;
    }

    setCardIdx(cardIdx! + 1)


  }

  return (
    <>
      <Container fluid className="border border-black mb-5" style={{backgroundColor: 'lightblue'}}>
        <h1>REVIEW CARDS</h1>
      </Container>
      {
        cardViews && (cardIdx != undefined) ?
          cardIdx == cardViews.length ?
            <>
              <Container>
                <Card_b>
                  <Card_b.Header>
                    <div>congratulations! you've finished this review session / have no more cards to review</div>
                  </Card_b.Header>
                  <Card_b.Body>
                    <div style={{display: 'flex', justifyContent: 'center'}}>
                      <Button 
                        onClick={() => {
                          fetchAndDisplayDueCards()
                        }}
                        className='me-5'
                        variant='outline-primary'
                      >
                        start new review session
                      </Button>
                      <Button
                        href='/dashboard'
                        variant='outline-secondary'
                      >
                        exit
                      </Button>
                    </div>
                  </Card_b.Body>
                </Card_b>
              </Container>

              
              <div>

              </div>
            </>
          :
            <>
              <Card_b>
                <Card_b.Header>
                  <b>current review session: </b>
                  card {cardIdx + 1}/{cardViews.length}
                  <Card_b>
                    <Stack direction='horizontal' gap={2} className='p-2'>
                      {
                        cardViews.map((c, i) => {
                          let text = ''
                          let bgc;
                          let tc;
                          if (i < cardIdx) {
                            text = `${i + 1}`;
                            bgc = 'green'
                            tc = 'white'
                          } else if (i == cardIdx) {
                            bgc = 'lightblue'
                            tc = 'black'
                            text = `${i + 1}`;
                          } else {
                            bgc = 'grey'
                            tc ='white'
                            text = `${i + 1}`;
                          }
                          return (
                            <div 
                              key={i} 
                              style={{
                                backgroundColor: bgc, 
                                color: tc, 
                                minHeight: '1.5em', 
                                minWidth: '1.5em', 
                                borderRadius: '7.5em',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                paddingLeft: '0.5em',
                                paddingRight: '0.5em'
                              }}

                            >
                             {text}
                            </div>
                          )
                        })
                      }
                    </Stack>
                  </Card_b>
                </Card_b.Header>
                <Card_b.Body>
                  <CardView
                    card={cardViews[cardIdx].card}
                    setShowFront={(v) => updateCardViews(old => {
                      old![cardIdx].front = v;
                    })}
                    showFront={cardViews[cardIdx].front}
                    onGrade={(q) => onGradeCard(cardViews[cardIdx].card, q)}
                    height='70vh'
                  />
                </Card_b.Body>
              </Card_b>
              {/* <div>current review session: card {cardIdx + 1} / {cardViews.length}</div> */}
              {/* <div style={{display: 'flex', border: '1px solid black'}}>

              </div> */}

            </>
        :
          <div>fetching...</div>
      }
    </>
  )
}

export function ReviewCards_() {
  const authContext = useContext(AuthContext);
  return (
    authContext.account ? 
      <ReviewCards/> 
    : 
    <div>you must login to access this feature</div>
  )
}