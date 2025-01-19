import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { Route, Routes, useParams, useSearchParams } from "react-router-dom";
import { TDeckInfo, Word } from "../../global";
import { deleteWordFromDeck, getDeckInfo, getWordsInDeck } from "./service/requestHelper";


const WORDS_PER_PAGE = 10
function DeckView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const deckId = searchParams.get('deckId')
  const pageIdx = searchParams.get('pageIdx')
  // const { deckId, pageIdx } = useParams();
  const [words, setWords] = useState<Word[]>();
  const [deckInfo, setDeckInfo] = useState<TDeckInfo>();
  const authContext = useContext(AuthContext);
  const acct = authContext.account!;
  
  async function fetchAndSetWords() {
    const fetchedWords = await getWordsInDeck(acct.username, acct.password, deckId!, Number(pageIdx) * WORDS_PER_PAGE, WORDS_PER_PAGE);
    if ('error' in fetchedWords) {
      window.alert('couldn\'t fetch words')
      return;
    }
    setWords(fetchedWords)

    const deckInfo = await getDeckInfo(acct.username, acct.password, deckId!)
    if ('error' in deckInfo) {
      window.alert('couldn\'t get deck info')
      return
    }
    setDeckInfo(deckInfo)
    
  }

  useEffect(() => {
    fetchAndSetWords();
  }, [searchParams]);

  
  const NUMPAGES = deckInfo ? Math.floor(deckInfo.totalWords / WORDS_PER_PAGE) : null

  return (
    <>
      {
        words ?
          <div style={{border: '1px solid red', minHeight: '30vh', padding:'1em'}}>
            <h2>deckname: {deckInfo ? deckInfo.name : 'NA'}</h2>
            <div>total words: {deckInfo ? deckInfo.totalWords : 'NA'}</div>
            <div>known words: {deckInfo ? deckInfo.knownWords : 'NA'}</div>
            <div style={{display: 'flex', justifyContent: 'space-between', border: '1px solid black', padding: '0.5em', marginBottom: '0.5em'}}>
              <div style={{display: 'flex', alignItems: 'center'}}>
              
                <div>page: {pageIdx} / {NUMPAGES ? NUMPAGES : 'NA'}</div>
                <button disabled={Number(pageIdx) == 0} onClick={() => {
                  setSearchParams(old => {
                    old.set('pageIdx', (Math.max(Number(old.get('pageIdx')) - 1, 0)).toString());               
                    return old
                  });
                }}>
                  ←
                </button>
                <button disabled={NUMPAGES != null && Number(pageIdx) == NUMPAGES} onClick={() => {
                  setSearchParams(old => {
                    old.set('pageIdx', (Number(old.get('pageIdx')) + 1).toString());               
                    return old
                  });
                }}>
                  →
                </button>
                
              </div>
              <div>
                filter:
                <input type='text'></input>
              </div>
            </div>

            {
              words.map(w => {
                let kanjiColor = 'black';
                let def = '';
                if (w.knownLevel) {
                  if (w.knownLevel == 0) {
                    kanjiColor = 'blue'
                    def = '(known level 0, new)'
                  } else {
                    kanjiColor = 'forestgreen'
                    def = `(known level ${w.knownLevel})`
                  }
                }

                return (
                  <div style={{border: '1px solid black', padding: '0.5em', color: kanjiColor, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <div style={{display: 'flex'}}>
                      <div style={{border: '1px solid black', padding: '0.1em'}}> {w.seqNum}</div>
                      <div style={{border: '1px solid black', fontSize: '20px', marginLeft: '1em', backgroundColor: 'whitesmoke'}}>
                        {w.kanji}
                      </div>
                      <div style={{marginLeft: '1em'}}>
                        {def}
                      </div>
                    </div>
                    <div>
                      <button style={{backgroundColor: 'pink'}} onClick={async () => {
                        if (window.confirm(`are you sure you want to delete the word ${w.kanji} from your deck?`)) {
                          let res = await deleteWordFromDeck(acct.username, acct.password, deckId!, w.id);
                          if ('error' in res) {
                            window.alert(res)
                            return;
                          }
                          await fetchAndSetWords()
                        }


                      }}>delete</button>
                      <button style={{marginLeft: '1em'}}>view cards (todo)</button>
                    </div>
                  </div>
                )
              })
            }
          </div>
        :
          <div>loading...</div>
      }
    </>
  )


}

function BrowseDeck() {
  //:deckId/:pageId
  return <DeckView/>
}

// this function will make use of urls to get it's data
// precondition, the deck to be browsed indeed belongs to the account 
export function BrowseDeck_() {
  const authContext = useContext(AuthContext);
  return (
    authContext.account ? 
    <BrowseDeck />
    :
    <div>you must log in to use this feature</div>
  )
}