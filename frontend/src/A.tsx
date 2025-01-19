import { useCallback, useContext, useEffect, useState } from "react"
import { Account, Card, Word } from "../../global";
import { AuthContext } from "./context/AuthContextProvider";
import { getCardsForWord, getExampleSentencesForWord, getWord } from "./service/requestHelper";
import { EditText, EditTextarea } from "react-edit-text"
import 'react-edit-text/dist/index.css'
import { useParams } from "react-router-dom";

// export interface ExampleSentence {
//   id: string;
//   jpn: string;
//   eng: string;
//   default_word_wordForm: string;
//   default_wordId: string;
// }
// export interface CardData {
//   entrySeq: string
//   kanji: string
//   kanjiOther: string
//   reading: string
//   readingOther: string
//   definitions: string[]
//   exampleSentences: ExampleSentence[]
// }


// function getCardFromWord() {
//   const newCard : Card = {
//     id: 'new',
//     accountId: acct.id,
//     wordId: word.id,
//     cardData: {
//       entrySeq: word.entrySeq,
//       kanji: word.kanji,
//       kanjiOther: word.kanjiOther.join(', '),
//       reading: word.reading,
//       readingOther: word.readingOther.join(', '),
//       definitions: word.definitions.map((def, i) => `${i + 1}. ${def.glosses.join(';')}. ${def.positions.join(', ')}`).join('\n'),
//       exampleSentences: []
//     },
//     knownLevel: 0,
//     lastReviewed: null,
//     dateAdded: new Date()
//   }
//   const egSentences = await getExampleSentencesForWord(acct.username, acct.password, word.id);
//   if ('error' in egSentences) {
//     window.alert(egSentences.error)
//   } else {
//     newCard.cardData.exampleSentences = egSentences
//   }
// }

// all these pages should be editable
// given a Card
//  - display editor which autofills based on the word / the existing card
//  - allow users to make edits
//  - makes the API call to create / change existing card when user presses 'save' (or similar)
// function CardEditor({cardID, wordID}: {cardID: string, wordID: string})
// {
//   const authContext = useContext(AuthContext)
//   const acct = authContext.account as Account;



//   const cardData = card.cardData;

//   const [defs_textArea, setDefs_textArea] = useState('');

//   // console.log(JSON.stringify(card, null, 4))
//   return (
//     <>
//       <div>cardID: {card.id}</div>
//       <h1 style={{fontSize: 50}}>{cardData.kanji}</h1>
      
//       <div>
//         reading: 
//         {cardData.reading}
//       </div>

//       <div>
//         other readings: 
//         {cardData.readingOther}
//       </div>

//       <div>definitions:</div>
//       <EditTextarea 
//         name='definitions'
//         style={{border: '1px solid black'}}
//         value={defs_textArea}
//         onChange={(e) => setDefs_textArea(e.target.value)}
//       />
//       <h3>example sentences</h3>
//       <div>
//         <input type='checkbox'></input>
//         pick random sentence each time
//       </div>
//       <div>
//         <input type='checkbox'></input>
//         set fixed example sentence
//       </div>
//       <div style={{border: '1px solid black'}}>
//         {
//           cardData.exampleSentences.map(s => {
//             return <div style={{border: '1px solid black', paddingLeft: '0.5em', paddingRight: '0.5em', margin: '1em'}}>{s.eng}</div>
//           })
//         }
//       </div>
//     </>
//   )
// }

function CardCreation() {
  // given a word
  //   get all cards made for that word. Turn these into 'pages' for ease of display
  //   if no cards, create new card based on dictionary entry
  //   {word} : {word: Word}
  const authContext = useContext(AuthContext)
  const acct = authContext.account as Account;
  interface Page {
    card?: Card
    newCard?: boolean
    error?: string
    onPage: boolean
  }

  const { wordId } = useParams();
  const [pages, setPages] = useState<Page[]>([])

  useEffect(() => {
    async function mount() {
      if (!wordId) {
        setPages([{error: 'wordID not found', onPage: true}])
        return;
      }

      const word = await getWord(acct.username, acct.password, wordId);
      if ('error' in word) {
        setPages([{error: 'wordID not found', onPage: true}])
        return;
      }
      
      const cards = await getCardsForWord(acct.username,acct.password, wordId)
      if ('error' in cards) {
        window.alert(cards.error)
        return;
      }

      if (cards.length > 0) {
        const pages = cards.map((c, i) => {
          return {
            card: c,
            onPage: false,
          }
        })
        pages[0].onPage = true
        setPages(pages);
      } else {
        // direct user to creating a new card
        // add a 'card creation page'
        setPages([{newCard: true, onPage: true}])
      }
    }
    mount()
  }, [])

  const displayPage = (page: Page | undefined) => {
    if (!page) {
      return <></>
    }
    if ('error' in page) {
      return <div>{page.error}</div>
    }
    if ('newCard' in page) {
      // direct to card creation for 'new' card
      return <div>new card creation for {wordId}</div>
    }
    return <div>display page for card {page.card!.id}</div>
  }

  const shownPage = pages.find(page => page.onPage)
  return (
    <>
      {
        displayPage(shownPage)
      }
    </>
  )
}

// feels wrong not doing the API call at the start...
// makes it 'less in sync' with the database
// ignore all client side caching for now...

export function A() {
  const authContext = useContext(AuthContext);
  return (
    authContext.account ?
    <CardCreation />
    :
    <div>please log in</div>
  )
}