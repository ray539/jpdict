import { ReactNode, useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { Route, Routes, useParams, useSearchParams } from "react-router-dom";
import { TDeckInfo, Word } from "../../global";
import { deleteWordFromDeck, getDeckInfo, getWordsInDeck } from "./service/requestHelper";
import { WordListItem } from "./Search";

// OLD WORDS DESIGN
// let kanjiColor = 'black';
// let def = '';
// if (w.knownLevel) {
//   if (w.knownLevel == 0) {
//     kanjiColor = 'blue'
//     def = '(known level 0, new)'
//   } else {
//     kanjiColor = 'forestgreen'
//     def = `(known level ${w.knownLevel})`
//   }
// }

// return (
//   <div style={{border: '1px solid black', padding: '0.5em', color: kanjiColor, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
//     <div style={{display: 'flex'}}>
//       <div style={{border: '1px solid black', padding: '0.1em'}}> {w.seqNum}</div>
//       <div style={{border: '1px solid black', fontSize: '20px', marginLeft: '1em', backgroundColor: 'whitesmoke'}}>
//         {w.kanji}
//       </div>
//       <div style={{marginLeft: '1em'}}>
//         {def}
//       </div>
//     </div>
//     <div>
//       <button style={{backgroundColor: 'pink'}} onClick={onDeleteWord ? () => onDeleteWord(w) : () => {}}>delete</button>
//       <button style={{marginLeft: '1em'}}>view cards (todo)</button>
//     </div>
//   </div>
// )

// function WordsView({words, deleteButton, onDeleteWord, extraButtons} : {words: Word[], deleteButton: boolean, onDeleteWord : (w: Word) => Promise<void>, extraButtons: ReactNode[]}) {
//   const authContext = useContext(AuthContext);
//   const acct = authContext.account!;
//   return (
//     <>

//     </>
//   )
// }

const WORDS_PER_PAGE = 10

export function DeckInfoAndPageChange({deckInfo, pageIdx, setPageIdx} : {deckInfo: TDeckInfo, pageIdx: number, setPageIdx: (v: number) => void}) {
  const NUMPAGES = Math.floor(deckInfo.totalWords / WORDS_PER_PAGE)
  return (
    <>
      <div>total words: {deckInfo ? deckInfo.totalWords : 'NA'}</div>
      <div>known words: {deckInfo ? deckInfo.knownWords : 'NA'}</div>
      <div style={{display: 'flex', justifyContent: 'space-between', border: '1px solid black', padding: '0.5em', marginBottom: '0.5em'}}>
        <div style={{display: 'flex', alignItems: 'center'}}>
        
          <div>page: {pageIdx} / {NUMPAGES ? NUMPAGES : 'NA'}</div>
          <button disabled={pageIdx == 0} onClick={() => {setPageIdx(Math.max(0, pageIdx - 1))}}>
            ←
          </button>
          <button disabled={NUMPAGES != null && Number(pageIdx) == NUMPAGES} onClick={() => setPageIdx(Math.min(NUMPAGES, pageIdx + 1))}>
            →
          </button>
          
        </div>
        <div>
          filter:
          <input type='text'></input>
        </div>
      </div>
    </>
  )
}

/**
 * given a TDeckInfo object, and options to control pageIdx, display the deck
 * deleteButton: show delete button or not
 */
function DeckView({deckInfo, pageIdx, setPageIdx} : {deckInfo :  TDeckInfo, pageIdx : number, setPageIdx: (v: number) => void}) {
  const authContext = useContext(AuthContext);
  const acct = authContext.account!;
  const [words, setWords] = useState<Word[]>();

  async function fetchAndSetWords() {
    const fetchedWords = await getWordsInDeck(acct.username, acct.password, deckInfo.id, Number(pageIdx) * WORDS_PER_PAGE, WORDS_PER_PAGE);
    if ('error' in fetchedWords) {
      window.alert('couldn\'t fetch words')
      return;
    }
    setWords(fetchedWords)
  }

  async function onDeleteWord(w : Word) {
    if (window.confirm(`are you sure you want to delete the word ${w.kanji} from your deck?`)) {
      let res = await deleteWordFromDeck(acct.username, acct.password, deckInfo!.id, w.id);
      if ('error' in res) {
        window.alert(res)
        return;
      }
    }
    fetchAndSetWords()
  }

  useEffect(() => {
    fetchAndSetWords();
  }, [pageIdx]);

  return (
    <>
      <DeckInfoAndPageChange deckInfo={deckInfo} pageIdx={pageIdx} setPageIdx={setPageIdx}/>
      {
        words ?
          words.map(w => {
            return (
              <WordListItem 
                word={w}
                showOptionsPanel={false}
                onClickEllipsis={() => {}}
                extraButtons={
                  [
                    <button onClick={() => onDeleteWord(w)} style={{backgroundColor: 'pink'}}>
                      delete {/*TODO: also update deck info*/}
                    </button>
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

function BrowseDeck() {
  const authContext = useContext(AuthContext);
  const acct = authContext.account!;
  const [searchParams, setSearchParams] = useSearchParams();
  const deckId = searchParams.get('deckId')
  const pageIdx = searchParams.get('pageIdx') ? Number(searchParams.get('pageIdx')) : undefined
  const setPageIdx = (v : number) => {
    setSearchParams(old => {
      old.set('pageIdx', v.toString())
      return old;
    });
  }

  const [deckInfo, setDeckInfo] = useState<TDeckInfo>();
  async function onMount() {
    const deckInfo = await getDeckInfo(acct.username, acct.password, deckId!)
    if ('error' in deckInfo) {
      window.alert('couldn\'t get deck info')
      return
    }
    setDeckInfo(deckInfo)
    console.log(pageIdx);
  }
  
  useEffect(() => {
   onMount() 
  }, [])


  return (
    <>
      {
        deckId ?
          deckInfo ?
            pageIdx != null ?
              <div style={{border: '1px solid red', minHeight: '30vh', padding:'1em'}}>
                <h2>deckname: {deckInfo ? deckInfo.name : 'NA'}</h2>
                <DeckView deckInfo={deckInfo} pageIdx={pageIdx} setPageIdx={setPageIdx}/>
              </div>
            :
            <div>query parameter pageIdx missing</div>
          :
            <div>fetching...</div>
        :
        <div>query parameter deckId missing</div>
      }
    </>
  )
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