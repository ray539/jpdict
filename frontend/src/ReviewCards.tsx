import { useContext, useEffect, useState } from "react"
import { Card, ExampleSentence, getRandomIntInclusive, SearchResult, Word } from "../../global"
import { changeWordKnownLevel, getCardsForWord, getDueCards, getWordsSimilarToWord, searchDictionary, updateCard, updateCards, updateWordsSimilarToWord } from "./service/requestHelper"
import { AuthContext } from "./context/AuthContextProvider"
import { Updater, useImmer } from "use-immer"
import { useNavigate } from "react-router-dom"
import { TimeContext } from "./context/TimeContextProvider"
import { SentenceListItem } from "./WordDetails"
import { Container, Card as Card_b, Stack, Button, Modal, Col, Row } from "react-bootstrap"
import { SearchBar, WordListItem } from "./Search"

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

const NUM_WORDS_PER_PAGE = 10
export function SimilarWordBrowser({currWordId, similarWords, setAndSaveSimilarWords, onClickSimilarWord = () => {}} : {currWordId: string, similarWords: Word[], setAndSaveSimilarWords: (v: Word[]) => Promise<void>, onClickSimilarWord?: (v: string) => void}) {
  const authContext = useContext(AuthContext);
  const acct = authContext.account!;
  const [wordsTmp, setWordsTmp] = useState<Word[]>(similarWords);

  const [searchBarInput, setSearchBarInput] = useState<string>('');
  const [searchStr, setSearchStr] = useState('');
  const [pageIdx, setPageIdx] = useState(0);
  const [wordInfos, setWordInfos] = useState<SearchResult[]>();

  async function onSearch() {
    if (searchBarInput.length < 2 || searchBarInput.replace(/\s+/, '').length < 2) {
      window.alert('please edit your search string')
      return;
    }
    setSearchStr(searchBarInput);
    setPageIdx(0);
  }

  async function fetchAndSetWordInfos() {
    if (!searchStr) return;
    const fetchedWordInfos = await searchDictionary(acct.username, acct.password, searchStr, pageIdx * NUM_WORDS_PER_PAGE, NUM_WORDS_PER_PAGE);
    if ('error' in fetchedWordInfos) {
      window.alert('couldn\'t search')
      return;
    }
    setWordInfos(fetchedWordInfos)
  }


  useEffect(() => {
    fetchAndSetWordInfos()
  }, [searchStr, pageIdx])

  const inWords = (w: Word) => wordsTmp.find(word => word.id == w.id) != undefined;

  return (
    <>
      <Row>
        <Col xs>
          <Card_b>
            <Card_b.Body>
              <SearchBar 
                searchBarInput={searchBarInput} 
                setSearchBarInput={setSearchBarInput}
                onSearch={onSearch}
              />

              <Card_b className='mb-3'>
                <Card_b.Body>
                  {
                  wordInfos ?
                    wordInfos.length > 0 ?
                      wordInfos.map((wi, i) => 
                        <WordListItem
                          word={wi.word}
                          extraButtons={
                            [
                              <div>{inWords(wi.word) ? '📝' : ''}</div>,
                              <Button
                                disabled={wi.word.id == currWordId}
                                variant={inWords(wi.word) ? 'danger' : 'primary'}
                                onClick={() => {
                                  if (inWords(wi.word)) {
                                    setWordsTmp(wordsTmp.filter(word => word.id != wi.word.id))
                                  } else {
                                    setWordsTmp(wordsTmp.concat(wi.word))
                                  }
                                }}>
                              {inWords(wi.word) ? 'remove' : 'add'}
                              </Button>,
                            ]
                          }
                        />
                      )
                      :
                        <div>no results found</div>
                    :
                      <div> enter some search terms and press the blue search button</div>
                  }
                </Card_b.Body>
              </Card_b>
            </Card_b.Body>
          </Card_b>
        </Col>
        <Col xs='auto'>
          <Card_b>
            <Card_b.Header>
              <b>words I confuse</b><br></br>
              <b>this word with</b><br></br>
              <b>(top 3 show on card)</b>
            </Card_b.Header>
            <Card_b.Body style={{minHeight: '50vh', maxHeight: '70vh', overflowY: 'scroll', overflowX: 'hidden'}}>
              <Stack direction='vertical' gap={1}>
                {
                  wordsTmp.length > 0 ?
                    wordsTmp.map((wordTmp, i) => {
                      return (
                        <Card_b 
                          className='p-1 fs-4' 
                          style={{
                            backgroundColor: i < 3 ? 'pink' : 'whitesmoke',
                            border: i < 3 ? '1px solid red' : ''
                          }}
                        >
                          <Stack direction='horizontal' gap={1}>
                            {wordTmp.kanji}
                            <Button
                              variant='danger'
                              size='sm'
                              onClick={() => {
                                setWordsTmp(wordsTmp.filter(w => w.id != wordTmp.id))
                              }}
                            >
                              remove
                            </Button>
                            {
                              i < 3 && <div></div>
                            }

                          </Stack>
                          
                        </Card_b>
                      )
                    })
                  :
                    <div>this list is empty</div>
                }
              </Stack>
            </Card_b.Body>
            <Card_b.Footer>
              <Button 
                className='w-100'
                onClick={() => {
                  setAndSaveSimilarWords(wordsTmp)
                }}
              >
                save changles
              </Button>
            </Card_b.Footer>
          </Card_b>
        </Col>
      </Row>
    </>
  )
}

function CardBack({card, height, onGrade = () => {}, onClickSimilarWord = () => {}} : {card: Card, height: string, onGrade?: (q: number) => void, onClickSimilarWord?: (wordId: string) => void}) {
  const authContext = useContext(AuthContext);
  const acct = authContext.account!;

  const [similarWords, setSimilarWords] = useState<Word[]>();
  
  async function setAndSaveSimilarWords(newWords: Word[]) {
    const ret = await updateWordsSimilarToWord(acct.username, acct.password, card.wordId, newWords.map(w => w.id))
    if ('error' in ret) {
      window.alert('couldn\'t save')
      return;
    }
    setSimilarWords(structuredClone(newWords));
    window.alert('saved successfully')
  }

  const [showModal, setShowModal] = useState(false);

  async function fetchAndSetSimilarWords() {
    const fetchedSimilarWords = await getWordsSimilarToWord(acct.username, acct.password, card.wordId);
    if ('error' in fetchedSimilarWords) {
      window.alert('couldn\'t fetch similar words')
      return;
    }
    setSimilarWords(fetchedSimilarWords)
  }
  

  useEffect(() => {
    fetchAndSetSimilarWords()
  }, []);

  // const height = '80vh'
  return (
    <>
      <Modal
        show={showModal}
        size='xl'
        onHide={() => setShowModal(false)}
      >
        <Modal.Header>
          <h1>confused with... search for word</h1>
        </Modal.Header>
        <Modal.Body>
          {
            similarWords ?
              <SimilarWordBrowser
                currWordId={card.wordId}
                similarWords={similarWords}
                setAndSaveSimilarWords={setAndSaveSimilarWords}
                onClickSimilarWord={onClickSimilarWord}
              />
            :
              <div>fetching...</div>
          }

        </Modal.Body>
      </Modal>
      
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

            <div>
              <div style={{display: 'flex', justifyContent: 'center'}} className='mb-1'>
                {
                  similarWords ?
                    similarWords.slice(0, 3).map(w => {
                      return (
                        <Button
                          variant='danger'
                          onClick={() => onClickSimilarWord(w.id)}
                          className='me-2'
                        >
                          <Stack
                            direction='horizontal'
                            gap={2}
                          >
                            <div>confused with </div>
                            <Card_b style={{backgroundColor: 'whitesmoke'}} className='p-1 fs-4'>
                              <ruby>{w.kanji}<rt>{w.reading}</rt></ruby>
                            </Card_b>
                          </Stack>
                        </Button>
                      )
                    })
                  :
                    <div className='me-2'>fetching...</div>
                }
              </div>
              <div style={{display: 'flex', justifyContent: 'center', marginBottom: `calc(0.1 * ${height})`}}>
                <Button
                  variant='danger'
                  className='me-2'
                  onClick={() => setShowModal(true)}
                >
                  confused with 🔎
                </Button>
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
              <div style={{marginTop: `calc(0.1 * ${height})`}}>
                <h1 style={{fontSize: `calc(0.1 * ${height})`, }}>{card.cardData.kanji}</h1>
                {
                  card.cardType == 'SENTENCE' &&
                  <SentenceDisplay sentence={card.cardData.exampleSentences[0]} jpnOnly/>
                }
              </div>

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
export function CardView({card, showFront, height = '80vh', setShowFront, onGrade = (q) => {}, onClickSimilarWord = () => {}} : {card: Card, showFront: boolean, height?: string, setShowFront: (v:boolean) => void, onGrade?: (q: number) => void, onClickSimilarWord?: (wordId: string) => void}) {
  // const cardView = pageState.cards![pageState.cIndx!];
  return (
    showFront ?
      <CardFront card={card} height={height} onClickShowAnswer={() => setShowFront(false)}/>
    :
      <CardBack card={card}  height={height} onGrade={onGrade} onClickSimilarWord={onClickSimilarWord} />
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

  async function onClickSimilarWord(wordId: string, otherWordId: string) {
    // get all cards with word attatched to 'wordId' or 'otherWordId'
    // set known level to zero for all of them
    // ofc, also update the known time
    // but don't edit any ease factors

    const fetchedCards1 = await getCardsForWord(acct.username, acct.password, wordId);
    if ('error' in fetchedCards1) {
      window.alert('gay')
      return;
    }
    const fetchedCards2 = await getCardsForWord(acct.username, acct.password, otherWordId);
    if ('error' in fetchedCards2) {
      window.alert('gay2')
      return
    }
    const allCardIds = fetchedCards1.concat(fetchedCards2).map(w => w.id);
    await updateCards(acct.username, acct.password, allCardIds, {
      knownLevel: 0,
      lastReviewed: new Date(timeContext.getCurrentTimestamp()),
      timeDue: new Date(timeContext.getCurrentTimestamp() + knownLevelDelayTime(0, 2.5))
    })
    setCardIdx(cardIdx! + 1)
  }

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
                    onClickSimilarWord={(other) => onClickSimilarWord(cardViews[cardIdx].card.wordId, other)}
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