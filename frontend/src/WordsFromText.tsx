import { useContext, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { AccordionItem, Button, Card, Container, Form, Spinner, Stack } from "react-bootstrap";
import { extractFromTextAndSetWordsToAdd } from "./service/requestHelper";




function WordsFromText() {
  const authContext = useContext(AuthContext);
  const acct = authContext.account!
  const [text, setText] = useState('')
  const [tmp, setTmp] = useState(false)

  return (
    <>
      <Container fluid className="border border-black mb-5" style={{backgroundColor: 'lightblue'}}>
        <h1>
          EXTRACT WORDS
        </h1>
        
      </Container>
      <Container className="pb-5">
        <Card>
          <Card.Header>
            <h3>extract japanese words from a given piece of text</h3>
          </Card.Header>
          <Card.Body>
            <Form className='mb-2'>
              <h4>paste text here</h4>
              <Form.Control
                as='textarea'
                className='mb-3'
                style={{minHeight: '30vh'}}
                value={text}
                onChange={(e) =>setText(e.target.value)}
              />
              {
                tmp ? 
                  <Card 
                    key="new"
                    className='p-1'
                    bg='primary'
                    text='light'
                    border='info'
                    style={{
                      opacity: '70%'
                    }}
                  >
                    <Stack direction='horizontal' gap={1}>
                      <Spinner animation="grow" size="sm"/>
                      <div>
                        extracting...
                      </div>
                    </Stack>
                  </Card>
                :
                  <Button
                    onClick={async (e) => {
                      setTmp(true)
                      const res = await extractFromTextAndSetWordsToAdd(acct.username, acct.password, text)
                      if ('error' in res) {
                        window.alert(res.error)
                        setTmp(false)
                        return;
                      }
                      setTmp(false)
                      window.open('/add-words-to-deck')
                    }}
                  >
                    extract and add to deck
                  </Button>
              }


            </Form>
          </Card.Body>
        </Card>
      </Container>
  </>
  )
}

export function WordsFromText_() {
  const authContext = useContext(AuthContext);
  return (
    authContext.account ? 
    <WordsFromText />
    :
    <div>you must log in to use this feature</div>
  )
}