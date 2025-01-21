import { ReactNode, useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { Link, useSearchParams } from "react-router-dom";
import { checkSentenceInput, ExampleSentence, knownLevelToColorDescription, Word } from "../../global";
import { addCustomSentenceForWord, deleteCustomSentenceForWord, getCustomSentencesForWord, getExampleSentencesForWord, getWord } from "./service/requestHelper";


export function SentenceListItem({sentence, showDeleteButton = false, onDelete, extraButtons = []}: {sentence: ExampleSentence, showDeleteButton?: boolean, onDelete?: Function, extraButtons?: ReactNode[]}) {
  return (
    <div style={{border: '1px solid black', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5em', backgroundColor: 'whitesmoke'}}>
      <div>
        <div>{sentence.jpn}</div>
        <div>{sentence.eng}</div>
      </div>
      {extraButtons}
      {
        showDeleteButton ?
          <div>
            <button style={{backgroundColor: 'pink'}} onClick={() => {
              if (onDelete) {
                onDelete();
              }
            }}>x</button>
          </div>
        :
          ''
      }
    </div>
  )
}


function WordDetails() {
  const authContext = useContext(AuthContext);
  const acct = authContext.account!
  const [searchParams, setSearchParams] = useSearchParams();
  const wordId = searchParams.get('wordId')
  const [word, setWord] = useState<Word | null>();
  
  const [exampleSentences, setExampleSentences] = useState<ExampleSentence[] | null>()
  const [customSentences, setCustomSentences] = useState<ExampleSentence[] | null>();
  
  const [jpn_input, setJpn_input] = useState('');
  const [eng_inp, setEng_input] = useState('');

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
    const fetchedSentences = await getExampleSentencesForWord(acct.username, acct.password, wordId)
    if ('error' in fetchedSentences) {
      window.alert('couldn\'t fetch sentences')
      return;
    }
    setExampleSentences(fetchedSentences)
    const fetchedCustomSentences = await  getCustomSentencesForWord(acct.username, acct.password, wordId);
    if ('error' in fetchedCustomSentences) {
      window.alert('couldn\'t fetch sentences')
      return;
    }
    setCustomSentences(fetchedCustomSentences)
  }

  useEffect(() => {
    fetchAndSetWord()
  }, [searchParams])

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

  return (
    <>
    <div style={{border: '1px solid red', minHeight: '30vh', padding:'1em'}}>
      {
        wordId ?
          word ?
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
            <br></br>
            <h2>default example sentences</h2>
            <div>these are built in sentences from the database</div>
            <div style={{border: '1px solid black', padding: '1em'}}>
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
            </div>
            <br></br>
            <h2>custom example sentences</h2>
            <div>these are example sentences generated by you</div>

            <div style={{border: '1px solid black', padding: '1em'}}>
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
                          const res2 = await getCustomSentencesForWord(acct.username, acct.password, wordId);
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
            </div>
            <b>add a sentence</b>
            <form style={{marginBottom: '1em'}} onSubmit={async (e) => {
              e.preventDefault();
              let res = checkSentenceInput(jpn_input, word)
              if ('error' in res) {
                window.alert(res.error);
                return;
              }
              const foundWordForm = res.foundWordForm;
              await addCustomSentenceForWord(acct.username, acct.password, wordId, jpn_input, eng_inp, foundWordForm);
              const newCustomSentences = await getCustomSentencesForWord(acct.username, acct.password, wordId);
              if ('error' in newCustomSentences) {
                window.alert('couldn\'t get custom sentences')
                return;
              }
              setCustomSentences(newCustomSentences)
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', margin: '1em'}}>
                <label htmlFor="f1" style={{marginRight: '1em'}}>JPN</label> 
                <input id="f1" type="text" style={{width: '100%'}} value={jpn_input} onChange={(e) => {
                  setJpn_input(e.target.value)
                }}/>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', margin: '1em'}}>
                <label htmlFor="f2" style={{marginRight: '1em'}}>ENG</label> 
                <input id="f2" type="text" style={{width: '100%'}} value={eng_inp} onChange={(e) => {
                  setEng_input(e.target.value)
                }}/>
              </div>
              <button>submit</button>
            </form>
            <h2>actions</h2>
            <button style={{backgroundColor: 'lightblue'}} onClick={(e) => window.open(`/cards-for-word/?wordId=${wordId}`)}>view / create cards</button>
            <button style={{backgroundColor: 'lightblue'}}>add word to deck</button>


          </>
          :
          <div>fetching... </div>
        :
        <div>invalid word id</div>
      }

    </div>
    </>
  )
}


export function WordDetails_() {
  const authContext = useContext(AuthContext);
  return (
    authContext.account ? 
    <WordDetails/>
    :
    <div>you must log in to use this feature</div>
  )
}