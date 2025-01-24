import React, { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { Link, Navigate, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { knownLevelToColorDescription, SearchResult, Word } from "../../global";
import { searchDictionary } from "./service/requestHelper";
import { Dropdown, Modal } from "react-bootstrap";

interface Option {
  label: string,
  fctn: Function
}

export function WordListItem({word, extraButtons} : {word: Word, extraButtons?: ReactNode[]}) {

  const [showDetails, setShowDetails] = useState(false)
  // const [showOptions, setShowOptions] = useState(false)
  const elementRef = useRef<HTMLDivElement | null>(null)
  const height = elementRef.current ? elementRef.current.offsetHeight : 0

  const {kanjiColor, def} = knownLevelToColorDescription(word.knownLevel)
  const navigate = useNavigate()
  
  return (
    <>
      <div ref={elementRef} style={{border: '1px solid black', padding: '0.5em', color: kanjiColor, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative'}}>
        <div style={{display: 'flex'}}>
          {word.seqNum != null ? <div style={{border: '1px solid black', padding: '0.1em'}}> {word.seqNum}</div> : ''}
          <div style={{border: '1px solid black', fontSize: '20px', marginLeft: '1em', backgroundColor: 'whitesmoke', color: kanjiColor}}>
            {word.kanji}
          </div>
          <div style={{marginLeft: '1em'}}>
            {def}
          </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center'}}>
          {extraButtons}
          <button style={{marginLeft: '1em'}} onClick={() => setShowDetails(!showDetails)}>details: {showDetails ? '▲' : '▼'}</button>
          <Dropdown style={{marginLeft: '1em'}}>
            <Dropdown.Toggle variant="success" size="sm">
              more options
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item 
                onClick={() => {
                  window.open(`/cards-for-word?wordId=${word.id}&cardIdx=0`, '_blank')
                }}
              >
                view cards
              </Dropdown.Item>
              <Dropdown.Item
                 onClick={() => {
                  window.open(`/add-words-to-deck?wordIds=["${word.id}"]`, '_blank')
                }}
              >add to deck...</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>


      </div>
      {
        showDetails ? 
          <div style={{border: '1px solid black', padding: '0.5em'}}>
            {word.reading}
            {
              <ul>
                {
                  word.definitions.map(def => {
                    return <li>{def.glosses.join('; ')}</li>
                  })
                }
              </ul>
            }
            <button style={{marginLeft: '1em'}} onClick={() => {window.open(`/word-details/?wordId=${word.id}`)}}>more details</button>
          </div>
        :
          ''
      }
    </>
  )
}

export function SearchBar({searchBarInput, setSearchBarInput, onSearch} : {searchBarInput: string, setSearchBarInput: (v: string) => void, onSearch: () => void}) {

  return (
    <div style={{display: 'flex', justifyContent: 'space-between', border: '1px solid black', padding: '0.5em', marginBottom: '0.5em'}}>
      <form onSubmit={(e) => {
        e.preventDefault()
        onSearch()
      }}>
        search terms: 
        <input type='text' value={searchBarInput} onChange={(e) => setSearchBarInput(e.target.value)}></input>
        <button>more filters</button>
        <button type='submit' style={{backgroundColor: 'skyblue'}} >search</button>
      </form>
    </div>
  )
}

const NUM_WORDS_PER_PAGE = 10
function Search() {
  const authContext = useContext(AuthContext);
  const acct = authContext.account!;
  const [searchParams, setSearchParams] = useSearchParams();
  const pageIdx = Number(searchParams.get('pageIdx'))
  const searchStr = searchParams.get('searchStr')
  const [wordInfos, setWordInfos] = useState<SearchResult[]>();

  const [searchBarInput, setSearchBarInput] = useState<string>('');
  const navigate = useNavigate();

  const onSearch = async() => {
    if (searchBarInput.length < 2 || searchBarInput.replace(/\s+/, '').length < 2) {
      window.alert('please edit your search string')
      return;
    }
    setSearchParams(old => {
      old.set('searchStr', searchBarInput);
      old.set('pageIdx', '0');
      return old
    })
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

  const NUMPAGES = 3;
  return (
    <>
    <div style={{border: '1px solid red', minHeight: '30vh', padding:'1em'}}>
      <h2>search dictionary</h2>
      <SearchBar onSearch={onSearch} searchBarInput={searchBarInput} setSearchBarInput={setSearchBarInput}/>

      {
        wordInfos ?
          wordInfos.length > 0 ?
          wordInfos.map((wi) => <WordListItem word={wi.word}/>)
          :
          <div>no results found</div>
        :
          <div> enter some search terms and press the blue search button</div>
      }
    </div>
    </>
  )
}

export function Search_() {
  const authContext = useContext(AuthContext);
  return (
    authContext.account ? 
    <Search />
    :
    <div>you must log in to use this feature</div>
  )
}