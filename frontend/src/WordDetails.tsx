import { ReactNode, useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { Link, useSearchParams } from "react-router-dom";
import { checkSentenceInput, ExampleSentence, knownLevelToColorDescription, Word } from "../../global";
import { addCustomSentenceForWord, deleteCustomSentenceForWord, getCustomSentencesForWord, getExampleSentencesForWord, getWord, getWordsSimilarToWord, updateWordsSimilarToWord } from "./service/requestHelper";
import { Button, Card, Col, Container, Form, Modal, Stack } from "react-bootstrap";
import { SimilarWordBrowser } from "./ReviewCards";


export function SentenceListItem({sentence, showDeleteButton = false, onDelete, extraButtons = []}: {sentence: ExampleSentence, showDeleteButton?: boolean, onDelete?: Function, extraButtons?: ReactNode[]}) {
  return (
    <Card style={{backgroundColor: 'beige', border: '1px solid green'}} className="mb-1">
      <Stack direction='horizontal' className='p-2' gap={2}>
        <Col className='me-auto'>
          <div>{sentence.jpn}</div>
          <div>{sentence.eng}</div>
        </Col>
        {extraButtons}
        {
          showDeleteButton && 
          <Button
            size="sm"
            variant='danger'
            onClick={() => {
              if (onDelete) {
                onDelete();
              }
            }}
          >
            -
          </Button>
        }
      </Stack>
    </Card>
  )
}

/**
 * given a word object, display it
 */
export function WordView({word, otherButtons} :  {word: Word, otherButtons?: ReactNode[]}) {
  const authContext = useContext(AuthContext)
  const acct = authContext.account!
  
  const [exampleSentences, setExampleSentences] = useState<ExampleSentence[] | null>()
  const [customSentences, setCustomSentences] = useState<ExampleSentence[] | null>();
  
  const [jpn_input, setJpn_input] = useState('');
  const [eng_inp, setEng_input] = useState('');

  const [similarWords, setSimilarWords] = useState<Word[]>();

  async function fetchAndSetSimilarWords() {
    const fetchedSimilarWords = await getWordsSimilarToWord(acct.username, acct.password, word.id);
    if ('error' in fetchedSimilarWords) {
      window.alert('couldn\'t fetch similar words')
      return;
    }
    setSimilarWords(fetchedSimilarWords)
  }
  
  async function setAndSaveSimilarWords(newWords: Word[]) {
    const ret = await updateWordsSimilarToWord(acct.username, acct.password, word.id, newWords.map(w => w.id))
    if ('error' in ret) {
      window.alert('couldn\'t save')
      return;
    }
    setSimilarWords(structuredClone(newWords));
    window.alert('saved successfully')
  }

  let allPositions: string[] = [];
  let kanjiColor = '';
  let def = '';
  if (word) {
    for (let def of word.definitions) {
      allPositions = allPositions.concat(def.positions)
    }
    let a = knownLevelToColorDescription(word.knownLevel)
    kanjiColor = a.kanjiColor;
    def = a.def
  }

  async function fetchAndSetSentences() {
    const fetchedSentences = await getExampleSentencesForWord(acct.username, acct.password, word.id)
    if ('error' in fetchedSentences) {
      window.alert('couldn\'t fetch sentences')
      return;
    }
    setExampleSentences(fetchedSentences)
    const fetchedCustomSentences = await  getCustomSentencesForWord(acct.username, acct.password, word.id);
    if ('error' in fetchedCustomSentences) {
      window.alert('couldn\'t fetch sentences')
      return;
    }
    setCustomSentences(fetchedCustomSentences)
  }

  useEffect(() => {
    fetchAndSetSentences()
    fetchAndSetSimilarWords()
  }, [])

  const [showModal, setShowModal] = useState(false)

  return (
      <>
        <Modal
          show={showModal}
          size='xl'
          onHide={() => setShowModal(false)}
        >
          <Modal.Header>
            <h1>often confused with: search for word</h1>
          </Modal.Header>
          <Modal.Body>
            {
              similarWords ?
                <SimilarWordBrowser
                  currWordId={word.id}
                  similarWords={similarWords}
                  setAndSaveSimilarWords={setAndSaveSimilarWords}
                />
              :
                <div>fetching...</div>
            }

          </Modal.Body>
        </Modal>
          {
            <>
              <h1 style={{fontSize: 50}}><ruby>{word.kanji}<rt>{word.reading}</rt></ruby> </h1>
              <div style={{color: kanjiColor}}>{def}</div>
              <div><i>{allPositions.join(', ')}</i></div>
              {
                word.readingOther.length > 0 ?
                <div>other readings: {word.readingOther.join(' ')}</div>
                :
                ''
              }
              <div>id: {word.id}</div>
              <br></br>
              <Stack direction='horizontal' gap={2}>
                <Card className='p-1' style={{backgroundColor: 'whitesmoke'}}>
                  <b>I often confuse this word with: </b>
                </Card>
                {
                  similarWords ?
                    similarWords.length > 0 &&
                      similarWords.map(w => {
                        return (
                          <Card className='p-1 fs-4'>
                            <ruby>{w.kanji}<rt>{w.reading}</rt></ruby>
                          </Card>
                        )
                      })
                  :
                  <div>fetching...</div>
                }
                <Button
                  size='sm'
                  onClick={() => setShowModal(true)}
                >✎</Button>
              </Stack>


              
              <br></br>
              <h2>definitions:</h2>
              <ul>
                {
                  word.definitions.map(def => {
                    return ( 
                      <li>
                        {def.glosses.join('; ')}
                        &nbsp;
                        {
                          def.antonyms.length > 0 ?
                            <span>(antonym(s): {def.antonyms.map(a => <Link to={`/search?searchStr=${a}&pageIdx=0`} target="_blank">{a}</Link>)})</span>
                          :
                            ''
                        }
                        &nbsp;
                        {
                          def.xrefs.length > 0 ?
                            <span>(see also: {def.xrefs.map(a => <Link to={`/search?searchStr=${a}&pageIdx=0`}>{a}</Link>)})</span>
                          :
                            ''
                        }
                      </li>
                    )
                  })
                }
              </ul>
              <h2>default example sentences</h2>
              <Card>
                <Card.Header>
                <div>these are built in sentences from the database</div>
                </Card.Header>
                <Card.Body>
                  {
                    exampleSentences ?
                      exampleSentences.length > 0 ?
                        exampleSentences.map(s => {
                          return (
                            <SentenceListItem sentence={s} key={s.id}/>
                          )
                        })
                      :
                        <div>no sentences found for this word</div>
                      :
                    <div>fetching...</div>
                  }
                </Card.Body>
              </Card>

              <h2>custom example sentences</h2>
              <Card className='mb-2'>
                <Card.Header>
                  <div>these are example sentences generated by you</div>
                </Card.Header>
                <Card.Body>
                  {
                    customSentences ?
                      customSentences.length > 0 ?
                        customSentences.map(s => {
                          return <SentenceListItem sentence={s} key={s.id} showDeleteButton={true} onDelete={async () => {
                            if (window.confirm('are you sure you wish to delete this sentence?')) {
                              const res1 = await deleteCustomSentenceForWord(acct.username, acct.password, s.id);
                              if ('error' in res1) {
                                window.alert(res1.error)
                                return;
                              }
                              const res2 = await getCustomSentencesForWord(acct.username, acct.password, word.id);
                              if ('error' in res2) {
                                window.alert(res2.error);
                                return;
                              }
                              setCustomSentences(res2)
                            }
    
                          }}></SentenceListItem>
                        })
                      :
                        <div>no sentences found</div>
                      :
                    <div>fetching...</div>
                  }
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <b>add a sentence</b>
                </Card.Header>
                <Card.Body>
                  <Form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      let res = checkSentenceInput(jpn_input, word)
                      if ('error' in res) {
                        window.alert(res.error);
                        return;
                      }
                      const foundWordForm = res.foundWordForm;
                      await addCustomSentenceForWord(acct.username, acct.password, word.id, jpn_input, eng_inp, foundWordForm);
                      const newCustomSentences = await getCustomSentencesForWord(acct.username, acct.password, word.id);
                      if ('error' in newCustomSentences) {
                        window.alert('couldn\'t get custom sentences')
                        return;
                      }
                      setCustomSentences(newCustomSentences)
                    }}
                  >
                    <Form.Label 
                      htmlFor={word.id + 'jpnInp'}
                    >
                      Japanese text:
                    </Form.Label>

                    <Form.Control 
                      id={word.id + 'jpnInp'}
                      value={jpn_input} 
                      onChange={(e) => {
                        setJpn_input(e.target.value)
                      }}
                      placeholder={`sentence containing "${word.kanji}"`}
                    />

                    <Form.Label 
                      htmlFor={word.id + 'engInp'}
                    >
                      English text:
                    </Form.Label>

                    <Form.Control 
                      id={word.id + 'engInp'}
                      value={eng_inp} 
                      onChange={(e) => {
                        setEng_input(e.target.value)
                      }}
                      className='mb-3'
                      placeholder="english translation"
                    />

                    <Button type='submit'>
                      submit
                    </Button>

                  </Form>
                </Card.Body>
              </Card>
              <h2>actions</h2>
              {otherButtons}
            </>
          }
    </>
  )
}


function WordDetails() {
  const authContext = useContext(AuthContext);
  const acct = authContext.account!
  const [searchParams, setSearchParams] = useSearchParams();
  const wordId = searchParams.get('wordId')
  const [word, setWord] = useState<Word | null>();

  async function fetchAndSetWord() {
    if (!wordId) {
      return;
    }
    const fetchedWord = await getWord(acct.username, acct.password, wordId)
    if ('error' in fetchedWord) {
      window.alert('couldn\'t fetch word')
      return;
    }
    console.log(fetchedWord);
    setWord(fetchedWord)
  }

  useEffect(() => {
    fetchAndSetWord()
  }, [searchParams])


  return (
    wordId ?
      word ?
        <>
          <Container fluid className="border border-black mb-5" style={{backgroundColor: 'lightblue'}}>
            <h1>WORD DETAILS</h1>
          </Container>
          <Container className='mb-5'>
            <Card>
              <Card.Header>
                <div className='h4'>word info</div>
              </Card.Header>
              <Card.Body>
                <WordView 
                  word={word}
                  otherButtons={[
                    <Button 
                      variant="outline-primary" 
                      className='me-5'
                      href={`/cards-for-word/?wordId=${word.id}`}
                    >
                      view / create cards
                    </Button>,
                    <Button 
                      variant="outline-primary"
                      href={``} // TODO
                    >
                      add word to a deck
                    </Button>
                  ]}
                />
              </Card.Body>
            </Card>

          </Container>

        </>
      :
      <div>fetching...</div>
    :
    <div>no wordId provided</div>
  )

}


export function WordDetails_() {
  const authContext = useContext(AuthContext);
  return (
    authContext.account ? 
    <>
      <WordDetails/>
    </>
    :
    <div>you must log in to use this feature</div>
  )
}