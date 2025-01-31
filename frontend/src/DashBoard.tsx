import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { Link, useNavigate } from "react-router-dom";
import { TDeckInfo } from "../../global";
import { getTDeckListForUser_service } from "./service/service";
import { Button, Card, Col, Container, Form, Modal, ProgressBar, Row } from "react-bootstrap";
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
      <Container fluid className="border border-black" style={{backgroundColor: 'lightblue'}}>
        <h1>DASHBOARD</h1>
      </Container>

      <Container className='pb-5'>
        <Col className="text-center fs-1">
            Welcome back, "{acct.username}" <br></br>
            Your current daily streak is: 1
        </Col>
        <Col className="text-center fs-5 ">
          your current learning progress (known words) / (total words) is:
        </Col>
        <Col className="text-center" style={{fontSize: '75px'}}>
          50 %
        </Col>
        <Col className="text-center fs-5 mb-3">
          you haven't completed your daily goal of 10 new words yet
        </Col>
        <Col className="text-center mb-1">
          <Button variant="outline-primary" className="fs-4"
            href="/new-words2?wordIdx=0"
          >
            learn new words
          </Button>
        </Col>
        <Col className="text-center mb-5">
          <Button variant="outline-primary" className="fs-4"
            href='/review-cards'
          >
            review due cards
          </Button>
        </Col>
        <h2>target word decks</h2>
        <Card>
          <Card.Body>
            {
              tDeckInfo ?
                tDeckInfo.length > 0 ?
                  tDeckInfo.map(tdeckInfo => {
                    return (
                      <Card key={tdeckInfo.id} className='mb-3'>
                        <Card.Header>
                          <Row>
                            <Col xs='auto'>
                              <Card.Text className="h3">
                                {tdeckInfo.name}
                              </Card.Text>
                              <Card.Text>
                                known words: {tdeckInfo.knownWords} <br></br>
                                total words: {tdeckInfo.totalWords}
                              </Card.Text>
                            </Col>
                            <Col xs></Col>
                            <Col xs='auto'>
                              <Button href={`/browse-deck/?deckId=${tdeckInfo.id}&pageIdx=0`}> browse / edit </Button>
                            </Col>
                          </Row>
                        </Card.Header>
                        <Card.Body>
                          <div className='mb-2'>progress:</div>
                          <ProgressBar now={tdeckInfo.totalWords == 0 ? 0 : (tdeckInfo.knownWords / tdeckInfo.totalWords) * 100} label={
                            String(tdeckInfo.totalWords == 0 ? 0 : (tdeckInfo.knownWords / tdeckInfo.totalWords) * 100) + '%'
                          }/>
                        </Card.Body>
                      </Card>
                    )
                  })
                :
                <div>you have no target decks</div>
              :
            <div>fetching...</div>
          }
          </Card.Body>
        </Card>

        
        <h3>create new deck</h3>
        <Card>
          <Card.Body>
            <Form
              onSubmit={async (e) => {
                e.preventDefault();
                await createDeck(acct.username, acct.password, deckNameInp, [])
                fetchAndSetDeckList()
              }}
            >
              <Form.Label className='fw-bold'>deck name</Form.Label>
              <Form.Control value={deckNameInp} onChange={(e) => setDeckNameInp(e.target.value)} className='mb-3'/>
              <Button type='submit'>
                submit
              </Button>

            </Form>
          </Card.Body>
        </Card>

      </Container>
    </>
  )
}

export function Dashboard_() {
  const authContext = useContext(AuthContext)
  
  return (
    authContext.account ? <Dashboard /> : <div>you must login to access this feature</div>
  )
}