import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { useParams, useSearchParams } from "react-router-dom";
import { Button, Card, Container, Form, Modal } from "react-bootstrap";
import { addWordsToDeck, getTDeckListForUser, getWordsToAdd, setWordsToAdd, wordIdsToWords } from "./service/requestHelper";
import { SearchResult, TDeckInfo, Word } from "../../global";
import { WordListItem } from "./Search";

function AddWordsToDeck() {
  const authContext = useContext(AuthContext);
  const acct = authContext.account!

  // const [searchParams, setSearchParams] = useSearchParams();
  // const [wordIds, setWordIds] = useState<string[]>()
  const [words, setWords] = useState<Word[]>();
  
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

  async function fetchWords() {
    // if (!wordIdsParam) {
    //   return;
    // }
    // console.log(wordIdsParam);
    try {
      // const wordIds = JSON.parse(wordIdsParam) as string[]
      // const fetchedWords = await wordIdsToWords(acct.username, acct.password, wordIds);
      const fetchedWords = await getWordsToAdd(acct.username, acct.password);
      if ('error' in fetchedWords) {
        window.alert(fetchedWords.error)
        return;
      }
      setWords(fetchedWords)
    } catch (e) {
      window.alert(e)
      return;
    }
  }

  useEffect(() => {
    fetchDeckList()
    fetchWords()
  }, [])
  

  return (
    <>
      <Container fluid className="border border-black mb-5" style={{backgroundColor: 'lightblue'}}>
        <h1>ADD WORDS</h1>
      </Container>
      <Container>
        <Card>
          <Card.Header>
            <h3>add words to deck</h3>
          </Card.Header>
          <Card.Body>
            <h4>select a deck</h4>
            <Form.Select
              value={selectedDeckInfo ? selectedDeckInfo.id : ''}
              onChange={(e) => {
                if (!deckInfos) return;
                setSelectedDeckInfo(deckInfos.find(info => info.id == e.target.value))
                
              }}
              className='mb-3'
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

            <Card className='mb-3'>
              <Card.Header>
                <b>confirm deck info</b>
              </Card.Header>
              <Card.Body>
                <div>name: {selectedDeckInfo ? selectedDeckInfo.name : 'NA'}</div>
                <div>total words: {selectedDeckInfo ? selectedDeckInfo.totalWords : 'NA'}</div>
                <div>known words: {selectedDeckInfo ? selectedDeckInfo.knownWords : 'NA'}</div>
              </Card.Body>
            </Card>
            

            
            <h4>adding the following words: </h4>
            <Card className='mb-3'>
              <Card.Body>
                {
                  words ?
                    words.map(word => {
                      return (
                        <WordListItem
                          key={word.id}
                          word={word}
                        />
                      )
                    })
                  :
                  <div>fetching...</div>
                }
              </Card.Body>
            </Card>
            <div style={{display: 'flex', justifyContent: 'center'}}>
              {
                words ?
                  <Button
                  onClick={async () => {
                    // TODO: change this so that it adds the words from the database
                    if (!selectedDeckInfo) {
                      return;
                    }
                    const wordIds = words!.map(w => w.id);
                    const cnt = await addWordsToDeck(acct.username, acct.password, selectedDeckInfo.id, wordIds);
                    if ('error' in cnt) {
                      window.alert(cnt.error);
                      return;
                    }
                    const ret = await setWordsToAdd(acct.username, acct.password, []);
                    window.alert(`you just added ${cnt.count} entries to the deck '${selectedDeckInfo.name}'. ${wordIds.length - cnt.count} entries were not added due to being duplicates.`)
                    window.location.reload()
                  }}
                
                >
                  confirm
                </Button>
              :
                <div>fetching..</div>
              }

            </div>
          </Card.Body>
        </Card>

      </Container>
    </>
  )
}

export function AddsWordsToDeck_() {
  const authContext = useContext(AuthContext);
  return (
    authContext.account ?
    <AddWordsToDeck />
    :
    <div>you must login to access this feature</div>
  )
}