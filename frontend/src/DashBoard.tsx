import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { Link, useNavigate } from "react-router-dom";
import { TDeckInfo } from "../../global";
import { getTDeckListForUser_service } from "./service/service";

function Dashboard() {
  const authContext = useContext(AuthContext)
  const [tDeckInfo, setTDeckInfo] = useState<TDeckInfo[] | null>(null);
  const navigate = useNavigate();
  
  // get the decks for the user
  useEffect(() => {
    const todo = async () => {
      const res = await getTDeckListForUser_service(authContext.account?.username as string, authContext.account?.password as string );
      if ('error' in res) {
        window.alert(res.error);
        setTDeckInfo([])
        return;
      }
      setTDeckInfo(res);
    }
    todo();
  }, [])

  return (
    <>
      <h1>Dashboard</h1>
      <div>
        Your current learning progress is
      </div>
      <div style={{fontSize: 50}}>
        50%
      </div>
      <div>you haven't completed your daily goal of 10 new words yet</div>
      <div>
        <Link to="/new-words">
          <button>learn new words</button>
        </Link>
      </div>
      <div>
        <button onClick={() => navigate('/review-cards')}>review due cads</button>
      </div>
      <h2>target word decks</h2>
      {
        tDeckInfo ?
          tDeckInfo.length > 0 ?
            tDeckInfo.map(tdeckInfo => {
              return <div style={{border: '1px solid black'}}>
                <div>
                  name: {tdeckInfo.name}
                </div>
                <div>
                  totalWords: {tdeckInfo.totalWords}
                </div>
                <div>
                  knownWords: {tdeckInfo.knownWords}
                </div>
                <div>
                  <button onClick={() => {
                    navigate(`/browse-deck/?deckId=${tdeckInfo.id}&pageIdx=0`)
                  }}>view words</button>
                </div>
              </div>
            })
          :
          <div>you have no target decks</div>
        :
          <div>fetching...</div>
     }
    </>
  )
}

export function Dashboard_() {
  const authContext = useContext(AuthContext)

  return (
    authContext.account ? <Dashboard /> : <div>you must login to access this feature</div>
  )
}