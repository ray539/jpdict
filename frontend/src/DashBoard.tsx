import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { Link, useNavigate } from "react-router-dom";
import { TDeckInfo } from "../../global";
import { getTDeckListForUser_service } from "./service/service";
import { Button, Form, Modal } from "react-bootstrap";
import { createDeck } from "./service/requestHelper";

function Dashboard() {
  const authContext = useContext(AuthContext)
  const acct = authContext.account!
  const [tDeckInfo, setTDeckInfo] = useState<TDeckInfo[] | null>(null);
  const navigate = useNavigate();
  
  async function fetchAndSetDeckList() {
    const res = await getTDeckListForUser_service(acct.username as string, acct.password as string );
    if ('error' in res) {
      window.alert(res.error);
      return;
    }
    setTDeckInfo(res);
  }

  // get the decks for the user
  useEffect(() => {
    fetchAndSetDeckList()
  }, [])

  const [deckNameInp, setDeckNameInp] = useState('');

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
        <Link to="/new-words2?wordIdx=0">
          <button>learn new words</button>
        </Link>
      </div>
      <div>
        <button onClick={() => navigate('/review-cards')}>review due cads</button>
      </div>
      <h2>target word decks</h2>
      <div style={{border: '1px solid black', padding: '0.5em'}}>
        {
          tDeckInfo ?
            tDeckInfo.length > 0 ?
              tDeckInfo.map(tdeckInfo => {
                return (
                  <div key={tdeckInfo.id} style={{border: '1px solid black', backgroundColor:'beige'}}>
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
                      }}>view / edit deck</button>
                    </div>
                  </div>
                )
              })
            :
            <div>you have no target decks</div>
          :
            <div>fetching...</div>
      }
      </div>

      <h3>create deck</h3>
      <Form
        onSubmit={async (e) => {
          e.preventDefault();
          await createDeck(acct.username, acct.password, deckNameInp, [])
          fetchAndSetDeckList()
        }}
      >
        <Form.Label>deck name</Form.Label>
        <Form.Control value={deckNameInp} onChange={(e) => setDeckNameInp(e.target.value)}/>
        <button>submit</button>
      </Form>

     
    </>
  )
}

export function Dashboard_() {
  const authContext = useContext(AuthContext)
  
  return (
    authContext.account ? <Dashboard /> : <div>you must login to access this feature</div>
  )
}