import { useContext, useEffect, useState } from "react"
import { Card } from "../../global"
import { getDueCards, updateCard } from "./service/requestHelper"
import { AuthContext } from "./context/AuthContextProvider"
import { Updater, useImmer } from "use-immer"
import { useNavigate } from "react-router-dom"
import { TimeContext } from "./context/TimeContextProvider"

const CARD: Card = {
  "id": "0d6a8aca-88bc-462a-a9b6-47172bc37fad",
  "accountId": "4130041f-cdd0-4ae3-9d06-aac61e45dc9d",
  "wordId": "00e48c0e-4c41-4a68-9782-cf5834458b57",
  "cardData": {
      "kanji": "部門",
      "reading": "ぶもん",
      "entrySeq": "1499540",
      "kanjiOther": "",
      "definitions": "1. division (of a larger group);branch;field;class (subclass);group;category;department. noun (common) (futsuumeishi), nouns which may take the genitive case particle 'no'\n2. def 2\n3. def 3",
      "readingOther": "",
      "exampleSentences": [
          {
              "id": "838549c1-69a9-4760-852c-7ff60b4f2e4e",
              "eng": "History is a branch of the humanities.",
              "jpn": "歴史学は人文科学の一部門である。",
              "default_wordId": "00e48c0e-4c41-4a68-9782-cf5834458b57",
              "default_word_wordForm": "部門"
          }
      ]
  },
  "knownLevel": 0,
  "lastReviewed": null,
  "timeDue": (new Date("2024-12-12T02:05:09.115Z")),
  "dateAdded": (new Date("2024-12-12T01:35:09.115Z"))
}

function convertText(txt: string) {
  let res = []
  let currLine = ''
  let id = 0;
  for (let c of txt) {
    if (c === '\n') {
      res.push(currLine)
      currLine = ''
      res.push(<br key={id++}></br>)
    } else {
      currLine += c
    }
  }
  res.push(currLine)
  return res
}

function knownLevelDelayTime(knownLevel: number) {
  if (knownLevel == 0) {
    return 1800 * 1000 // 1/2 hour
  } else if (knownLevel == 1) {
    return 24 * 3600 * 1000 // 1 day
  } else if (knownLevel == 2) {
    return 48 * 3600 * 1000 // 2 days
  } else if (knownLevel == 3) {
    return 96 * 3600 * 1000 // 4 days
  } else if (knownLevel == 4) {
    return 144 * 3600 * 1000 // 6 days
  } else if (knownLevel == 5) {
    return 288 * 3600 * 1000 // 12 days
  }
  return Math.pow(2, knownLevel - 1) * 24 * 3600 * 1000
}

function CardBack({pageState, updatePageState} : {pageState: PageState, updatePageState: Updater<PageState>}) {
  const authContext = useContext(AuthContext);
  const timeContext = useContext(TimeContext)
  const acct = authContext.account!;
  const cardView = pageState.cards![pageState.cIndx!];
  const card = cardView.card;

  return (
    <div style={{border: '1px solid red'}}>
      <div style={{textAlign: 'center'}}>
        <div style={{height: '10vh'}}></div>
        <div>{card.cardData.reading}</div>
        <h1 style={{fontSize: '50px'}}>{card.cardData.kanji}</h1>
        <div>
          other readings: {card.cardData.readingOther}
        </div>
        <div style={{border: '1px solid green', height: '50vh', textAlign: 'left'}}>
          <div>dueDate: {(new Date(card.timeDue)).toLocaleString()}</div>
          <div>lastReviewed: {card.lastReviewed ? (new Date(card.lastReviewed)).toLocaleString() : "null"}</div>
          <h4>definition</h4>
          {convertText(card.cardData.definitions)}
        </div>

        <div style={{border: '1px solid green', display: 'flex', justifyContent: 'center'}}>
          <button onClick={async() => {
            // decrement the known level of the card
            // reset due date of the card
            let newCard = structuredClone(card) as Card;
            newCard.knownLevel = Math.max(0, newCard.knownLevel - 1);
            newCard.timeDue = new Date(timeContext.getCurrentTimestamp() + knownLevelDelayTime(newCard.knownLevel))
            newCard.lastReviewed = new Date(timeContext.getCurrentTimestamp());
            const updatedCard = await updateCard(acct.username, acct.password, newCard.id, newCard)
            if ('error' in updatedCard) {
              window.alert('couldn\'t update card')
              return;
            }
            updatePageState(old => {
              old.cards![old.cIndx!].card = newCard
              old.cIndx! += 1
            });
            // increment cIndx
            // if cIndx == end, then show page asking user to continue
            //    if continue, then bring in the next cards
          }}>fail</button>
          <div style={{width: '5em'}}></div>
          <button onClick={async () => {
            // increment known level of card
            // reset due date of card
            let newCard = structuredClone(card) as Card;
            console.log(newCard);
            
            newCard.knownLevel = Math.min(5, newCard.knownLevel + 1);
            newCard.timeDue = new Date(timeContext.getCurrentTimestamp() + knownLevelDelayTime(newCard.knownLevel))
            newCard.lastReviewed = new Date(timeContext.getCurrentTimestamp());
            const updatedCard = await updateCard(acct.username, acct.password, newCard.id, newCard)
            if ('error' in updatedCard) {
              window.alert('couldn\'t update card')
              return;
            }

            updatePageState(old => {
              old.cards![old.cIndx!].card = newCard;
              old.cIndx! += 1;
            })
            // increment cIndx
            // if cIndx == end, show page asking user to continue
            

          }}>pass</button>
        </div>
        
      </div>
    </div>
  )
}

function CardFront({pageState, updatePageState} : {pageState: PageState, updatePageState: Updater<PageState>}) {
  const card = pageState.cards![pageState.cIndx!].card;
  return (
    <div style={{border: '1px solid red'}}>
      <div style={{textAlign: 'center'}}>
        <div style={{height: '10vh'}}></div>
        <h1 style={{fontSize: '50px'}}>{card.cardData.kanji}</h1>
        <div style={{height: '50vh'}}></div>
        <button onClick={() => {
          updatePageState(old => {
            old.cards![old.cIndx!].front = false
          })
        }}>show answer</button>
      </div>
    </div>
  )
}

function CardView({pageState, updatePageState} : {pageState: PageState, updatePageState: Updater<PageState>}) {
  const cardView = pageState.cards![pageState.cIndx!];
  
  return (
    cardView.front ?
    <CardFront pageState={pageState} updatePageState={updatePageState} />
    :
    <CardBack pageState={pageState} updatePageState={updatePageState} />
  )
}

interface CardView {
  card: Card,
  front: boolean
}

interface PageState {
  cards?: CardView[]
  cIndx?: number
  // ending states:
  // - finished session, finished all cards

}

export function ReviewCards() {
  // onMount:
  // - get list of due cards
  // - go through all cards in that list
  const authContext = useContext(AuthContext);
  const timeContext = useContext(TimeContext)
  const acct = authContext.account!;
  const [pageState, updatePageState] = useImmer<PageState>({});
  const navigate = useNavigate();

  async function fetchAndDisplayDueCards() {
    const fetchedCards = await getDueCards(acct.username, acct.password, timeContext.getCurrentTimestamp(), 100);
    if ('error' in fetchedCards) {
      window.alert('can\'t fetch cards');
      return;
    }
    updatePageState(old => {
      old.cards = fetchedCards.map(c => {return {card: c, front: true}});
      old.cIndx = 0;
    })
  }
  useEffect(() => {
    fetchAndDisplayDueCards()
  }, []);

  let toDisplay;
  if (pageState.cards) {
    // then cIndx is also defined
    if (pageState.cIndx == pageState.cards.length) {
      toDisplay =
      <>
        <div>congratulations! you've finished this review session / have no more cards to review</div>
        <div>
          <button onClick={() => {
            fetchAndDisplayDueCards()
          }}>
            start new review session
          </button>
          <button onClick={() => navigate('/dashboard')}>
            exit
          </button>
        </div>
      </>
    } else {
      const cards = pageState.cards!;
      const cIndx = pageState.cIndx!;
      const cardToShow = cards[cIndx];
      toDisplay =
      <>
        <div>current review session: card {cIndx + 1} / {cards.length}</div>
        <div style={{display: 'flex', border: '1px solid black'}}>
        {
          cards.map((c, i) => {

            let text = i + 1;
            let bgc = 'grey';
            if (i == cIndx) {
              bgc = 'lightblue'
            }
            return <div key={i} style={{width: '20px', height: '20px', backgroundColor: bgc, margin: '0.5em'}}>{text}</div>
          })
        }
        </div>
        <CardView pageState={pageState} updatePageState={updatePageState}/>
      </>
    }
  } else {
    toDisplay = 
    <div>
      loading...
    </div>
  }

  return toDisplay
}

export function ReviewCards_() {
  const authContext = useContext(AuthContext);
  return (
    authContext.account ? 
      <ReviewCards/> 
    : 
    <div>you must login to access this feature</div>
  )
}