import React, { createContext, ReactElement, useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { changeWordKnownLevel, getNewWordsList, getTDeckListForUser, getWordsInDeck, searchDictionary, updateNewWordsList } from "./service/requestHelper";
import { TimeContext } from "./context/TimeContextProvider";
import { knownLevelToColorDescription, SearchResult, TDeckInfo, Word } from "../../global";
import { Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { WordView } from "./WordDetails";
import { Button, Card, Col, Container, Form, Modal, Row, Stack } from "react-bootstrap";
import { DeckInfoAndPageChange } from "./BrowseDeck";
import { SearchBar, WordListItem } from "./Search";


const WORDS_PER_PAGE = 10

function SpecificDeck({deckInfo, words, setWords} : {deckInfo : TDeckInfo, words: Word[], setWords: (v:Word[]) => void} ) {
  const authContext = useContext(AuthContext)
  const acct = authContext.account!
  const [pageIdx, setPageIdx] = useState(0);

  const [deckWords, setDeckWords] = useState<Word[]>();

  async function fetchAndSetDeckWords() {
    const fetchedWords = await getWordsInDeck(acct.username, acct.password, deckInfo.id, Number(pageIdx) * WORDS_PER_PAGE, WORDS_PER_PAGE);
    if ('error' in fetchedWords) {
      window.alert('couldn\'t fetch words')
      return;
    }
    setDeckWords(fetchedWords)
  }

  useEffect(() => {
    fetchAndSetDeckWords();
  }, [pageIdx])

  const inWords = (w: Word) => words.find(word => word.id == w.id) != undefined;

  return (
    <>
      <DeckInfoAndPageChange deckInfo={deckInfo} pageIdx={pageIdx} setPageIdx={setPageIdx}/>
      {
        deckWords ?
          deckWords.map(w => {
            return (
              <WordListItem 
                word={w}
                extraButtons={
                  [
                    <div>{inWords(w) ? '📝' : ''}</div>,
                    <button 
                      style={{
                        backgroundColor: inWords(w) ? 'pink' : 'lightblue',
                        marginLeft: '1em'
                      }} 
                      onClick={() => {
                        inWords(w) ? setWords(words.filter(word => word.id != w.id)) : setWords(words.concat(w))
                      }}>
                    {inWords(w) ? 'remove' : 'add'}
                    </button>,
                    
                  ]
                }
            />
            )
          })
        :
          <div>fetching...</div>
      }
    </>
  )
}

function AddFromDeck({words, setWords} : {words: Word[], setWords: (v:Word[]) => void}) {
  const authContext = useContext(AuthContext)
  const acct = authContext.account!
  const [selectedDeckInfo, setSelectedDeckInfo] = useState<TDeckInfo>();
  const [deckInfos, setDeckInfos] = useState<TDeckInfo[]>()

  async function fetchDeckList() {
    const fetchedDeckInfos = await getTDeckListForUser(acct.username, acct.password);
    if ('error' in fetchedDeckInfos) {
      window.alert('couldnt fetch decks')
      return;
    }    
    setDeckInfos(fetchedDeckInfos)
    setSelectedDeckInfo(fetchedDeckInfos[0])
  }
  useEffect(() => {
    fetchDeckList()
  }, [])
  

  return (
    <div style={{border: '1px solid black', minHeight: '30vh', padding: '0.5em'}}>
      <h3>select deck</h3>
      <Form.Select
      >
        {
          deckInfos ?
          deckInfos.map(deckInfo => {
            return (
              <option 
                key={deckInfo.id}
                value={deckInfo.id}
              >
                {deckInfo.name}
              </option>
            )
          })
          :
          <option>fetching...</option>
        }
      </Form.Select>
      {
        selectedDeckInfo ?
        <SpecificDeck deckInfo={selectedDeckInfo} words={words} setWords={setWords} />
        :
        <div> fetching...</div>
      }
      
    </div>
  )
}
const NUM_WORDS_PER_PAGE = 10
function AddFromDictionary({words, setWords} : {words: Word[], setWords: (v:Word[]) => void}) {
  const authContext = useContext(AuthContext)
  const acct = authContext.account!
  const [searchBarInput, setSearchBarInput] = useState('');
  const [searchStr, setSearchStr] = useState('');
  const [pageIdx, setPageIdx] = useState(0);
  const [wordInfos, setWordInfos] = useState<SearchResult[]>();

  const onSearch = async() => {
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

  const inWords = (w: Word) => words.find(word => word.id == w.id) != undefined;

  return (
    <div style={{border: '1px solid black', minHeight: '30vh', padding: '0.5em'}}>
      <h3>search dictionary</h3>
      <SearchBar 
        searchBarInput={searchBarInput}
        setSearchBarInput={setSearchBarInput}
        onSearch={onSearch}
      />
      {
        wordInfos ?
          wordInfos.length > 0 ?
          wordInfos.map((wi, i) => 
            <WordListItem 
              word={wi.word} 
              extraButtons={
                [
                  <div>{inWords(wi.word) ? '📝' : ''}</div>,
                  <button 
                    style={{
                      backgroundColor: inWords(wi.word) ? 'pink' : 'lightblue',
                      marginLeft: '1em'
                    }} 
                    onClick={() => {
                      inWords(wi.word) ? setWords(words.filter(word => word.id != wi.word.id)) : setWords(words.concat(wi.word))
                    }}>
                  {inWords(wi.word) ? 'remove' : 'add'}
                  </button>
                ]
              }
            />
          )
          :
          <div>no results found</div>
        :
          <div> enter some search terms and press the blue search button</div>
      }
    </div>
  )
}

function EditWordList_({words, setWords} : {words: Word[], setWords: (v:Word[]) => void}) {
  const { option } = useParams();
  console.log('here');
  console.log(option);
  const navigate = useNavigate()
  return (
    <>
      <button
        style={{backgroundColor: option == 'from-deck' ? 'limegreen' : ''}}
        onClick={() => navigate('/new-words2/edit/from-deck')}
      >add from deck</button>
      <button 
        style={{backgroundColor: option == 'from-dictionary' ? 'limegreen' : ''}}
        onClick={() => navigate('/new-words2/edit/from-dictionary')}
      >add from dictionary</button>
      {
        option == 'from-deck' ?
          <AddFromDeck words={words} setWords={setWords}/>
        :
          option == 'from-dictionary' ?
            <AddFromDictionary words={words} setWords={setWords}/>
          :
            <div>invalid word source. Try clicking a button above</div>
      }
    </>

  )
}

function EditWordList({currentWordList, setCurrentWordList}:{currentWordList: Word[], setCurrentWordList: (v:Word[]) => void}) {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext)
  const acct = authContext.account!

  type WordSource = 'DECK' | 'DICTIONARY'
  // const [wordSource, setWordSource] = useState<WordSource>('DECK')
  const [words, setWords] = useState<Word[]>(currentWordList);

  const change = words && currentWordList && JSON.stringify(words.map(w => w.id).sort()) != JSON.stringify(currentWordList.map(w => w.id).sort())


  return (
    <Modal 
      show 
      animation={false} 
      size='xl'
      onHide={() => {
        if (change) {
          if (window.confirm('You have unsaved changes to your word list. Discard these changes?')) {
            navigate('/new-words2?wordIdx=0')
          }
        } else {
          navigate('/new-words2?wordIdx=0')
        }
        
      }}
    >
      <Modal.Header closeButton>
        <h1>edit word list</h1>
      </Modal.Header>
      <div style={{border: '1px solid red', minHeight: '70vh', padding: '0.5em'}}>
        <h2>avaliable words</h2>
        <Routes>
          <Route path=":option/*" element={<EditWordList_ words={words} setWords={setWords}/>} />
          <Route path="*" element={<div>url doesn't contain a source</div>}/>
        </Routes>
        

        <h2>current list</h2>
        <div style={{border: '1px solid black', padding: '0.5em', marginBottom: '1em', display: 'flex', flexWrap: 'wrap'}}>
          {
            words.length > 0 ?
              words.map(word => {
                return (
                  <div style={{
                    border: '1px solid black', 
                    backgroundColor: 'whitesmoke', 
                    padding: '0.25em', 
                    textWrap: 'nowrap',
                    fontSize: '20px',
                    marginRight: '0.5em',

                  }}> 
                    <ruby>{word.kanji} <rt>{word.reading}</rt></ruby>
                    <button 
                      style={{marginLeft: '0.5em', backgroundColor: 'pink'}}
                      onClick={() => {
                        setWords(words.filter(w => w.id != word.id))
                      }}
                    >-
                    </button>
                  </div>
                )
              })
            :
              <div>word list is empty</div>
          }
        </div>
        <div style={{textAlign: 'center'}}>
          <button
            onClick={async () => {
              const res = await updateNewWordsList(acct.username, acct.password, words.map(w => w.id));
              if ('error' in res) {
                window.alert('couldn\'t update new words list')
                return;
              }
              setCurrentWordList(structuredClone(words))
              window.alert('word list updated successfully')
            }}
          >save
          </button>
        </div>
      </div>
    </Modal>
  )
}

function NewWords2() {
  const authContext = useContext(AuthContext);
  const timeContext = useContext(TimeContext)
  const navigate = useNavigate()
  const acct = authContext.account!
  
  const [words, setWords] = useState<Word[]>()
  const [searchParams, setSearchParams] = useSearchParams()
  const wordIdx = searchParams.get('wordIdx') ? Number(searchParams.get('wordIdx')) : -1
  const setWordIdx = (v: number) => setSearchParams(old => {
    old.set('wordIdx', v.toString());
    return old;
  })

  async function fetchAndDisplayWords() {
    const fetchedWords = await getNewWordsList(acct.username, acct.password, 'HIGHEST PRIO', timeContext.getCurrentTimestamp());
    // console.log(words);
    if ('error' in fetchedWords) {
      window.alert(fetchedWords.error);
      return;
    }
    setWords(fetchedWords);
  }

  useEffect(() => {
    fetchAndDisplayWords();
  }, [])

  let displayedWord : Word | undefined
  if (words != null && words.length > 0 && wordIdx >= 0 && wordIdx < words.length) {
    displayedWord = words[wordIdx]
  }

  return (
    <>
    <Routes>
      <Route 
        path="edit/*" 
        element={
        words ?
        <EditWordList 
          currentWordList={words} 
          setCurrentWordList={setWords} 
        />
        :
        <div>oops! You shouldn't be here</div>
      } 
      />
    </Routes>
    <Container fluid className="border border-black mb-5" style={{backgroundColor: 'lightblue'}}>
      <h1>LEARN NEW WORDS</h1>
    </Container>
    
    
    <Container className='pb-5'>
      <Card>
        <Card.Header>
          <h2>new words list</h2>
          <div>this list refreshes every day. Click on edit button on the left to edit this list</div>
        </Card.Header>

        <Card.Body>
          <Row>
            <Col xs='auto'>
              <Card>
                <Card.Header>
                  <div className="fw-bold">word markings:</div>
                  <div>✔: known word</div>
                  <div>🎯: daily word</div>

                </Card.Header>
                <Card.Body style={{minHeight: '50vh', maxHeight: '80vh', overflow: 'scroll', overflowX: 'hidden'}}>
                  <Stack gap={1}>
                    {
                      words ?
                        words.length > 0 ?
                          words.map((word, i) => {
                            return (
                              <Card 
                                key={word.id} 
                                style={
                                  {
                                    width: '100%', 
                                    backgroundColor: wordIdx === i ? 'limegreen' : 'whitesmoke', 
                                  }
                                }
                                onClick={() => setWordIdx(i)}
                              >
                                <Card.Header>
                                <Stack direction="horizontal" gap={2}>
                                  <Card className='ps-1 pe-1 fs-5' style={{color: 'white', backgroundColor: knownLevelToColorDescription(word.knownLevel).kanjiColor}}>
                                    {i + 1}
                                  </Card>
                                  <Card className='fs-4'>
                                    {word.kanji}
                                    {
                                      word.knownLevel != undefined ? '✔' : ''
                                    } 
                                  </Card>
                                </Stack>
                                </Card.Header>
                              </Card>
                            )

                          })
                        :
                        <div>this list is empty</div>
                      :
                        <div>fetching...</div>
                    }
                  </Stack>
                </Card.Body>
                <Card.Footer>
                  <Button 
                    className='w-100'
                    onClick={() => {
                      navigate('edit/from-deck')
                    }}
                  >edit list ✎
                  </Button>
                </Card.Footer>
              </Card>
            </Col>

            <Col xs className="">
              <Card style={{minHeight: '70vh'}}>
                <Card.Body>
                  {
                    displayedWord ?
                    <WordView 
                      key={displayedWord.id} 
                      word={displayedWord}
                      otherButtons={[
                      <button 
                        style={{backgroundColor: 'lightblue'}} 
                        onClick={async (e) => {
                          window.open(`/cards-for-word/?wordId=${displayedWord.id}&autoCreate=true`)
                          if (displayedWord.knownLevel== undefined) {
                            // update known level of word, if it is not already known
                            await changeWordKnownLevel(acct.username, acct.password, displayedWord.id, 0)
                            const newWord = structuredClone(displayedWord);
                            newWord.knownLevel = 0
                            setWords(words!.slice(0, wordIdx).concat([newWord]).concat(words!.slice(wordIdx + 1)));
                          }
                        }}
                      >
                        mark as learnt and create card
                      </button>,
                      <button style={{backgroundColor: 'lightblue'}}>add word to deck</button>
                      ]}
                    />
                    :
                    <div>select a word to display it</div>
                  }
                </Card.Body>
                
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>

    
    

    </>
  )
}

export function NewWords2_() {
  const authContext = useContext(AuthContext);
  return (
    authContext.account ?
    <NewWords2 />
    :
    <div>you must login to access this feature</div>
  )
}