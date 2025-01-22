import React, { createContext, ReactElement, useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { changeWordKnownLevel, getNewWordsList, getTDeckListForUser } from "./service/requestHelper";
import { TimeContext } from "./context/TimeContextProvider";
import { TDeckInfo, Word } from "../../global";
import { Navigate, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { WordView } from "./WordDetails";
import { Form, Modal } from "react-bootstrap";

function EditWordList({currentWordList, setCurrentWordList}:{currentWordList: Word[], setCurrentWordList: (v:Word[]) => void}) {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext)
  const acct = authContext.account!

  type WordSource = 'DECK' | 'DICTIONARY'
  const [wordSource, setWordSource] = useState<WordSource>('DECK')
  const [deckInfos, setDeckInfos] = useState<TDeckInfo[]>()
  const [selectedDeckInfo, setSelectedDeckInfo] = useState<TDeckInfo>();

  async function onMount() {
    const fetchedDeckInfos = await getTDeckListForUser(acct.username, acct.password);
    if ('error' in fetchedDeckInfos) {
      window.alert('couldnt fetch decks')
      return;
    }    
    setDeckInfos(fetchedDeckInfos)
    setSelectedDeckInfo(fetchedDeckInfos[0])
  }
  useEffect(() => {
    onMount()
  }, [])


  return (
    <Modal 
      show 
      animation={false} 
      size='xl'
      onHide={() => {
        navigate('/new-words2')
      }}
    >
      <Modal.Header closeButton>
        <h1>edit word list</h1>
      </Modal.Header>
      <div style={{border: '1px solid red', minHeight: '70vh', padding: '0.5em'}}>
        <h2>avaliable words</h2>
        <button style={{backgroundColor: wordSource == 'DECK' ? 'limegreen' : ''}}>add from deck</button>
        <button style={{backgroundColor: wordSource == 'DICTIONARY' ? 'limegreen' : ''}}>add from dictionary</button>
        <div style={{border: '1px solid black', minHeight: '30vh', padding: '0.5em'}}>
          Select deck:
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
        </div>

        <h2>current list</h2>
        <div style={{border: '1px solid black', padding: '0.5em', display: 'flex'}}>

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
      <Route path="edit/*" element={<EditWordList currentWordList={words!} setCurrentWordList={setWords} />} />
    </Routes>
    <h1>learn new words</h1>
    <div>this list refreshes every day. Click on edit button on the left to edit this list</div>
    <div style={{border: '1px solid red', minHeight: '30vh', padding:'1em', display: 'flex'}}>
      {/* left bar */}
      <div style={{border: '1px solid black', padding: '0.5em', minWidth: '10em', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{width: '100%'}}>
          <div style={{border: '1px solid black', textWrap: 'nowrap', marginBottom: '1em', padding: '0.5em'}}>
            <b>word markings: </b>
            <div>✔: known word</div>
            <div>🎯: daily word</div>
          </div>
          {
            words ?
              words.length > 0 ?
                words.map((word, i) => {
                  return (
                    <div 
                      key={word.id} 
                      style={
                        {
                          border: '1px solid black', 
                          width: '100%', 
                          backgroundColor: wordIdx === i ? 'limegreen' : 'white', 
                          fontSize: '25px'
                        }
                      }
                      onClick={() => setWordIdx(i)}
                    >
                    <span style={{fontSize: '20px'}}>{i + 1}.</span> {word.kanji}
                    {
                      word.knownLevel != null ? '✔' : ''
                    }
                    </div>
                  )

                })
              :
              <div>this list is empty</div>
            :
              <div>fetching...</div>
          }
        </div>
        
        <div style={{width: '100%'}}>
          <button 
            style={{width: '100%'}}
            onClick={() => {
              navigate('edit')
            }}
          >edit list ✎</button>
        </div>
        
      </div>

      {/* right page */}
      <div style={{border: '1px solid black', width: '100%'}}>
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
                if (!displayedWord.knownLevel) {
                  // update known level of word, if it is not already known
                  await changeWordKnownLevel(acct.username, acct.password, displayedWord.id, '0')
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
      </div>
    </div>
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