import { useContext } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { Route, Routes, useParams, useSearchParams } from "react-router-dom";


function CardsForWord() {
  const authContext = useContext(AuthContext);
  const acct = authContext.account!
  const [searchParams, setSearchParams] = useSearchParams();
  const wordId = searchParams.get('wordId')
  const cardIdx = searchParams.get('cardIdx')
  
  return (
    <>
    <div style={{border: '1px solid red', minHeight: '30vh', padding:'1em'}}>
      

    </div>
    </>
  )
}

export function CardsForWord_() {
  const authContext = useContext(AuthContext);
  
  return (
    authContext.account ? 
    <CardsForWord />
    :
    <div>you must log in to use this feature</div>
  )
}