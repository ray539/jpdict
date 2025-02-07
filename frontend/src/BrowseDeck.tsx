import { ReactNode, useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { Route, Routes, useParams, useSearchParams } from "react-router-dom";
import { TDeckInfo, Word } from "../../global";
import { deleteWordFromDeck, getDeckInfo, getWordsInDeck } from "./service/requestHelper";
import { WordListItem } from "./Search";
import { Card, Col, Container, Pagination, Row, Form, Badge, Button, Stack } from "react-bootstrap";

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

/**
 * 
 * numDisplay: how many pages links to display
 * @param param0
 * @returns 
 */
export function PageBrowser({pageIdx, setPageIdx, numPages, numDisplay}: {pageIdx: number, setPageIdx: (v: number) => void, numPages: number, numDisplay: number}) {
  const [base, setBase] = useState(Math.min(Math.floor((pageIdx) / numDisplay) * numDisplay + 1, numPages - numDisplay + 1));
  const onClickR = () => {
    if (base + 2 * numDisplay - 1 <= numPages) {
      setBase(base + numDisplay);
    } else {
      onClickRR();
    }
  }
  const onClickRR = () => {
    setBase(Math.max(numPages - numDisplay + 1, 1));
  }
  const onClickL = () => {
    if (base - numDisplay >= 1) {
      setBase(base - numDisplay);
    }  else {
      onClickLL()
    }
  }
  const onClickLL = () => {
    setBase(1);
  }

  function arrMinMax(min: number, max: number) {
    const array = [];
    for (let i = min; i <= max; i++) {
      array.push(i);
    }
    return array;
  }
  // total pages:
  // 1 2 3 ... NUMPAGES
  // 1 2 3 4 N
  // initially,
  // base = 1
  // window: [base..base + N - 1]

  // when click '>', if (base + N <= NUMPAGES), then base++
  // when click '<', if (base - N >= 1), then base--
  // when click '>>', base = max(NUMPAGES - N + 1, 1)
  // when click '<<', base = 1

  // base + N
  // given a page idx
  // 1 2 3 4 5 6

  // 


  return (
    <Pagination>
      <Pagination.First onClick={() => onClickLL()}></Pagination.First>
      <Pagination.Prev onClick={() => onClickL()}></Pagination.Prev>
      {
        (arrMinMax(base, base + numDisplay - 1)).map(pageNum => {
          return (
            <Pagination.Item active={pageNum == pageIdx + 1} onClick={(e) => {
              setPageIdx(pageNum - 1)
            }}>
              {pageNum}
            </Pagination.Item>
          )
        })
      }
      <Pagination.Next onClick={() => onClickR()}></Pagination.Next>
      <Pagination.Last onClick={() => onClickRR()}></Pagination.Last>
    </Pagination>
  )
}

export function DeckInfoAndPageChange({deckInfo, pageIdx, setPageIdx} : {deckInfo: TDeckInfo, pageIdx: number, setPageIdx: (v: number) => void}) {
  return (
    <>
      <Card className='mb-3'>
        <Card.Header>
          <div className='h4'>Deck info</div>
          <div>total words: {deckInfo ? deckInfo.totalWords : 'NA'}</div>
          <div>known words: {deckInfo ? deckInfo.knownWords : 'NA'}</div>
        </Card.Header>

        <Card.Body>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <Stack direction='horizontal' gap={2}>
              <Button
                href='/extract-words'
                target='_blank'
              >
                add words from text
              </Button>
              <Button variant='danger'>delete deck</Button>
            </Stack>

            <Stack direction='horizontal' gap={2}>
              <Card style={{backgroundColor: 'whitesmoke', width: '10em'}} className='p-1'>
                search:
              </Card>
              <Form.Control/>
              <Card style={{backgroundColor: 'whitesmoke', width: '7em'}} className='p-1'>
                filter:
              </Card>
              <Form.Control/>
            </Stack>
          </div>
        </Card.Body>
      </Card>
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

  interface WordI {
    word: Word,
    selected: boolean
  }

  const [words, setWords] = useState<WordI[]>();

  async function fetchAndSetWords() {
    const fetchedWords = await getWordsInDeck(acct.username, acct.password, deckInfo.id, Number(pageIdx) * WORDS_PER_PAGE, WORDS_PER_PAGE);
    if ('error' in fetchedWords) {
      window.alert('couldn\'t fetch words')
      return;
    }
    setWords(fetchedWords.map(w => {
      return {
        word: w,
        selected: false
      }
    }))
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
    adjustPageIndex()
  }, [pageIdx]);

  const NUMPAGES = Math.ceil(deckInfo.totalWords / WORDS_PER_PAGE)
  const N = 5;
  const existsSelected = words != undefined && words.map(w => w.selected).reduce((c, n) => c || n, false);

  console.log(NUMPAGES);
  
  async function adjustPageIndex() {
    if (pageIdx >= NUMPAGES){
      setPageIdx(NUMPAGES - 1);
    }
  }

  const [bigSelect, setBigSelect] = useState(false);

  return (
    <>
      <DeckInfoAndPageChange deckInfo={deckInfo} pageIdx={pageIdx} setPageIdx={setPageIdx}/>
      <Card className='mb-3'>
        <Card.Header>
          <h4>showing results for page {pageIdx + 1}</h4>
        </Card.Header>
        <Card.Body>
          <div className='ps-3 pe-3 pb-2 mb-3 border-bottom'>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <Stack direction="horizontal" gap={2}>
                  <Card className="fs-4 p-1" style={{color: 'grey'}}>
                    <b>#</b>
                  </Card>
                  <Card className="fs-4 p-1" style={{color: 'grey'}}>
                    <b>漢字</b>
                  </Card>
                </Stack>
                <Form.Check
                  className='fs-5'
                  checked={bigSelect}
                  onChange={() => {
                    if (!words) return;
                    setBigSelect(!bigSelect)
                    setWords(words.map(w => {return {...w, selected: !bigSelect}}))
                  }}
                />
            </div>
          </div>
          {
          words ?
            words.length > 0 ?
              words.map((w, i) => {
                return (
                  <WordListItem
                    word={w.word}
                    extraButtons={
                      [
                        <Button variant='danger' onClick={() => onDeleteWord(w.word)}>
                          delete {/*TODO: also update deck info*/}
                        </Button>
                      ]
                    }
                    selected={w.selected}
                    setSelected={(b) => {
                      setWords(words.slice(0, i).concat([{...words[i], selected: b}]).concat(words.slice(i + 1)))
                    }}

                />
                )
              })
              :
              <div>there are currently no words in this deck. Why not add some?</div>
            :
            <div>fetching...</div>
          }
        </Card.Body>
        {
          existsSelected &&
          <Card.Footer>
            <Stack direction="horizontal" gap={2}>
              <Button variant='danger'>delete</Button>
              <Button>add to deck</Button>
            </Stack>
          </Card.Footer>
        }

      </Card>
      <PageBrowser 
          numPages={NUMPAGES}
          numDisplay={N}
          pageIdx={pageIdx}
          setPageIdx={setPageIdx}
        />

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
            <>
              <Container fluid className="border border-black mb-5" style={{backgroundColor: 'lightblue'}}>
                <h1>BROWSE DECK: {deckInfo.name}</h1>
              </Container>
              <Container className="pb-5">
                <DeckView deckInfo={deckInfo} pageIdx={pageIdx} setPageIdx={setPageIdx}/>
              </Container>
            </>
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