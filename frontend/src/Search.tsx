import { useContext } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { Routes, useSearchParams } from "react-router-dom";


function Search() {

  const [searchParams, setSearchParams] = useSearchParams();
  const pageIdx = searchParams.get('pageIdx')
  const searchStr = searchParams.get('searchStr')
  

  const NUMPAGES = 3;
  return (
    <>
    <div style={{border: '1px solid red', minHeight: '30vh', padding:'1em'}}>
      <h2>search dictionary</h2>
      <div style={{display: 'flex', justifyContent: 'space-between', border: '1px solid black', padding: '0.5em', marginBottom: '0.5em'}}>
      <div>
        search terms: 
        <input type='text'></input>
        <button>more filters</button>
        <button style={{backgroundColor: 'skyblue'}}>search</button>
      </div>
    </div>
    {
        searchStr ?
        <div> </div>
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