import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { Route, Routes, useParams, useSearchParams } from "react-router-dom";
import { Word } from "../../global";
import { getWordsInDeck } from "./service/requestHelper";


const WORDS_PER_PAGE = 10
function DeckView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const deckId = searchParams.get('deckId')
  const pageIdx = searchParams.get('pageIdx')
  // const { deckId, pageIdx } = useParams();
  const [words, setWords] = useState<Word[]>();
  const authContext = useContext(AuthContext);
  const acct = authContext.account!;
  
  useEffect(() => {
    async function fetchAndSetWords() {
      const fetchedWords = await getWordsInDeck(acct.username, acct.password, deckId!, Number(pageIdx) * WORDS_PER_PAGE, WORDS_PER_PAGE);
      if ('error' in fetchedWords) {
        window.alert('couldn\'t fetch words')
        return;
      }
      console.log(fetchedWords);
      setWords(fetchedWords)
    }
    fetchAndSetWords();
  }, [searchParams]);


  return (
    <>
      {
        words ?
          <div style={{border: '1px solid red', minHeight: '30vh', padding:'1em'}}>
            <button disabled={Number(pageIdx) == 0} onClick={() => {
              setSearchParams(old => {
                old.set('pageIdx', (Math.max(Number(old.get('pageIdx')) - 1, 0)).toString());               
                return old
              });
            }}>
              prev page
            </button>
            <button onClick={() => {
              setSearchParams(old => {
                old.set('pageIdx', (Number(old.get('pageIdx')) + 1).toString());               
                return old
              });
            }}>
              next page
            </button>
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
                    <button style={{}}>view cards (todo)</button>
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