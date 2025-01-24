import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { useParams, useSearchParams } from "react-router-dom";
import { Form, Modal } from "react-bootstrap";
import { addWordsToDeck, getTDeckListForUser, wordIdsToWords } from "./service/requestHelper";
import { SearchResult, TDeckInfo, Word } from "../../global";
import { WordListItem } from "./Search";

function AddWordsToDeck() {
  const authContext = useContext(AuthContext);
  const acct = authContext.account!

  const [searchParams, setSearchParams] = useSearchParams();
  const wordIdsParam = searchParams.get('wordIds');

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
    if (!wordIdsParam) {
      return;
    }
    console.log(wordIdsParam);
    try {
      const wordIds = JSON.parse(wordIdsParam) as string[]
      const fetchedWords = await wordIdsToWords(acct.username, acct.password, wordIds);
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

  // useEffect(() => {


  // }, [])

  return (
    <>
      <h1>add words to deck</h1>
      <div style={{border: '1px solid red', minHeight: '30vh', padding:'1em'}}>
        {
          wordIdsParam ?
            words ?
            <>
              <h2>select a deck</h2>
              <Form.Select
                value={selectedDeckInfo ? selectedDeckInfo.id : ''}
                onChange={(e) => {
                  if (!deckInfos) return;
                  setSelectedDeckInfo(deckInfos.find(info => info.id == e.target.value))
                  
                }}
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
              <div>total words: {selectedDeckInfo ? selectedDeckInfo.totalWords : 'NA'}</div>
              <div>known words: {selectedDeckInfo ? selectedDeckInfo.knownWords : 'NA'}</div>
              <h2>adding the following word(s)</h2>
              {
                words.map(word => {
                  return (
                    <WordListItem
                      key={word.id}
                      word={word}
                    />
                  )
                })
              }
              <div style={{display: 'flex', justifyContent: 'center', marginTop: '1em'}}>
                <button
                  onClick={async () => {
                    if (!selectedDeckInfo) {
                      return;
                    }
                    const wordIds = words.map(w => w.id);
                    const cnt = await addWordsToDeck(acct.username, acct.password, selectedDeckInfo.id, wordIds);
                    if ('error' in cnt) {
                      window.alert(cnt.error);
                      return;
                    }
                    window.alert(`you just added ${cnt.count} entries to the deck '${selectedDeckInfo.name}'. ${wordIds.length - cnt.count} entries were not added due to being duplicates.`)
                  }}
                >submit</button>
              </div>
            </>
            :
            <div>fetching words...</div>
          :
          <div>wordIds is missing</div>
        }
      </div>
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