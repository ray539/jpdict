import React, { createContext, ReactElement, useContext, useEffect, useState } from "react";
import { AuthContext } from "./context/AuthContextProvider";
import { Account, Card, Word } from "../../global";
import { getCard, getCardsForWord, getExampleSentencesForWord, getNewWordsList, getWord } from "./service/requestHelper";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { EditTextarea } from "react-edit-text";
import { Updater, useImmer } from "use-immer";

interface CardView {
  cardId: string
  card?: Card
  onPage: boolean
}

interface WordView {
  kanji: string
  wordId: string
  onPage: boolean
  cards?: CardView[]
}

interface PageState {
  words?: WordView[]
}

interface PageContextT {
  pageState: PageState;
  updatePageState: Updater<PageState>
}

const PageContext = createContext<PageContextT>({
  pageState: {},
  updatePageState: () => {}
});

function PageContextProvider({children}: {children: ReactElement}) {
  const [pageState, updatePageState] = useImmer<PageState>({})
  return (
    <PageContext.Provider value={{
      pageState: pageState,
      updatePageState: updatePageState
    }}>
      {children}
    </PageContext.Provider>
  )
}

async function getCardFromWord(word: Word, acct: Account) {
  const newCard : Card = {
    id: 'new',
    accountId: acct.id,
    wordId: word.id,
    cardData: {
      entrySeq: word.entrySeq,
      kanji: word.kanji,
      kanjiOther: word.kanjiOther.join(', '),
      reading: word.reading,
      readingOther: word.readingOther.join(', '),
      definitions: word.definitions.map((def, i) => `${i + 1}. ${def.glosses.join(';')}. ${def.positions.join(', ')}`).join('\n'),
      exampleSentences: []
    },
    knownLevel: 0,
    lastReviewed: null,
    dateAdded: new Date()
  }
  const egSentences = await getExampleSentencesForWord(acct.username, acct.password, word.id);
  if ('error' in egSentences) {
    window.alert(egSentences.error)
  } else {
    newCard.cardData.exampleSentences = egSentences
  }
  return newCard
}

function CardView({wIndex, cIndex} : {wIndex: number, cIndex: number}) {
  const authContext = useContext(AuthContext)
  const acct = authContext.account as Account;
  const pageContext = useContext(PageContext);
  const pageState = pageContext.pageState;
  const updatePageState = pageContext.updatePageState;

  const wordView = pageState.words![wIndex];
  const cardView = pageState.words![wIndex].cards![cIndex];

  useEffect(() => {
    async function mount() {
      if (pageState.words![wIndex].cards![cIndex].card != undefined) {
        // system already knows card, don't do anything
        return;
      }

      if (cardView.cardId == "new") {
        // open editor for new card
        const word = await getWord(acct.username, acct.password, wordView.wordId);
        if ('error' in word) {
          return;
        }
        const newCard = await getCardFromWord(word, acct);
        updatePageState(old => {
          old.words![wIndex].cards![cIndex].card = newCard;
        });
      } else {
        const fetchedCard = await getCard(acct.username, acct.password, cardView.cardId);
        if ('error' in fetchedCard) {
          return;
        }
        updatePageState(old => {
          old.words![wIndex].cards![cIndex].card = fetchedCard;
        })
      }
    }
    mount();
  }, [wIndex, cIndex])
  const card = pageState.words![wIndex].cards![cIndex].card;

  return (
    card ?
      <>
        <div> cardID: {card.id}</div>
        <h1 style={{fontSize: 50}}> {card!.cardData.kanji}</h1>
        <div>
          reading: 
          {card.cardData.reading}
        </div>
        <div>
          other readings: 
          {card.cardData.readingOther}
        </div>
        <div>definitions:</div>
        <EditTextarea 
          name='definitions'
          style={{border: '1px solid black'}}
          value={card!.cardData.definitions}
          onChange={(e) => {
            updatePageState(old => {
              old.words![wIndex].cards![cIndex].card!.cardData.definitions = e.target.value;
            })
          }}
        />
        <h3>example sentences</h3>
        <div>
          <input type='checkbox'></input>
          pick random sentence each time
        </div>
        <div>
          <input type='checkbox'></input>
          set fixed example sentence
        </div>
        <div style={{border: '1px solid black'}}>
          {
            card.cardData.exampleSentences.map(s => {
              return <div key={s.id} style={{border: '1px solid black', paddingLeft: '0.5em', paddingRight: '0.5em', margin: '1em'}}>{s.eng}</div>
            })
          }
        </div>
      </>
    :
      <div>loading...</div>
  )

}

// precondition: ensure that 'word' is loaded
function WordView({wIndex} : {wIndex: number}) {
  const authContext = useContext(AuthContext)
  const acct = authContext.account as Account;
  const pageContext = useContext(PageContext);
  const pageState = pageContext.pageState;
  const updatePageState = pageContext.updatePageState;

  
  useEffect(() => {
    async function onMount() {
      if (pageState.words![wIndex].cards != undefined) {
        // system already knows cards in word, don't do anything
        return;
      }
      const fetchedCards = await getCardsForWord(acct.username,acct.password, pageState.words![wIndex].wordId)
      if ('error' in fetchedCards) {
        window.alert('can\'t get cards')
        return;
      }
      if (fetchedCards.length > 0) {
        updatePageState(old => {
          const cardsNew = fetchedCards.map(c => {
            return {
              cardId: c.id,
              onPage: false
            }
          })
          cardsNew[0].onPage = true;
          old.words![wIndex].cards = cardsNew;
        })
      } else {
        updatePageState(old => {
          old.words![wIndex].cards = [{cardId: "new", onPage: true}]
        })
      }
    }
    onMount()
  }, [wIndex])
  const cardViews = pageState.words![wIndex].cards;
  let toDisplay;
  
  if (cardViews) {
    const cardIndx = cardViews.findIndex(cv => cv.onPage)
    toDisplay = 
    <>
      <div style={{display: 'flex', alignItems: 'center', border: '1px solid black'}}>
        {
          cardViews.map((cv, i) => {
            let style : React.CSSProperties;
            if (cv.onPage) {
              style = {border: '1px solid black', paddingLeft: '0.5em', paddingRight: '0.5em', margin: '1em', textWrap: 'nowrap', backgroundColor: 'limegreen'}
            } else {
              style = {border: '1px solid black', paddingLeft: '0.5em', paddingRight: '0.5em', margin: '1em', backgroundColor: 'whitesmoke', textWrap: 'nowrap'}
            }
            return (
              <div key={cv.cardId} style={style} onClick={(e) => {
                updatePageState(old => {
                  for (let j = 0; j < old.words![wIndex].cards!.length; j++) {
                    if (j == i) {
                      old.words![wIndex].cards![j].onPage = true;
                    } else {
                      old.words![wIndex].cards![j].onPage = false;
                    }
                  }
                })
              }}> 
                {cv.cardId == "new" ? "new" : (i + 1)}
              </div>
            )
          })
        }
      </div>
      <div>
        <CardView wIndex={wIndex} cIndex={cardIndx}/>
      </div>
    </>
  } else {
    toDisplay = <div>loading...</div>
  }

  return (
    toDisplay
  )
  
}

export function NewWords() {
  const authContext = useContext(AuthContext)
  const acct = authContext.account as Account;

  const pageContext = useContext(PageContext);
  const pageState = pageContext.pageState;
  const updatePageState = pageContext.updatePageState;

  useEffect(() => {
    // update wordViews after getting new words
    async function onMount() {
      if (pageState.words != undefined) {
        // system already knows words, don't do anything
        return;
      }

      const fetchedWords = await getNewWordsList(acct.username, acct.password, 'HIGHEST PRIO', Date.now());
      // console.log(words);
      if ('error' in fetchedWords) {
        window.alert(fetchedWords.error);
        return;
      }      
      updatePageState(old => {
        const wordViews = fetchedWords.map(w => {
          return {
            kanji: w.kanji,
            wordId: w.id,
            onPage: false
          }
        })
        wordViews[0].onPage = true
        old.words = wordViews;
      })
    }
    onMount()
  }, [])
  const wordViews = pageState.words;
  let toDisplay;
  if (wordViews) {
    const shownwIdx = wordViews.findIndex(wv => wv.onPage);
    // if (shownwIdx == -1) {
    //   toDisplay = <div>xxx</div>
    //   return toDisplay;
    // }

    toDisplay = 
    <>
      <h1>learn new words</h1>
      <div style={{display: 'flex', minHeight: '90vh', border: '1px solid red'}}>
        {/* links to the words */}
        <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column', border: '1px solid black', minWidth: '5em', margin: '1em'}}>
          {
            wordViews.length > 0 ?
            wordViews.map((wv, i) => {
                let style : React.CSSProperties;
                if (wv.onPage) {
                  style = {border: '1px solid black', paddingLeft: '0.5em', paddingRight: '0.5em', margin: '1em', textWrap: 'nowrap', backgroundColor: 'limegreen'}
                } else {
                  style = {border: '1px solid black', paddingLeft: '0.5em', paddingRight: '0.5em', margin: '1em', backgroundColor: 'whitesmoke', textWrap: 'nowrap'}
                }
                return (
                  <div key={wv.kanji} style={style} onClick={(e) => {
                    updatePageState(old => {
                      for (let j = 0; j < old.words!.length; j++) {
                        if (j == i) {
                          old.words![j].onPage = true;
                        } else {
                          old.words![j].onPage = false;
                        }
                      }
                    })
                  }}>
                    {wv.kanji}
                  </div>
                )
              })
            :
              <div>no new words</div>
          }
        </div>
        {/* word display*/}
        <div style={{border: '1px solid black', width: '100%', margin: '1em', padding: '1em'}}>
          <WordView wIndex={shownwIdx}/>
        </div>
      </div>
    </>
  } else {
    toDisplay = <div>loading...</div>
  }
  
  return (
    toDisplay
  )
}

export function NewWords_() {
  const authContext = useContext(AuthContext);
  return (
    authContext.account ? 
    <PageContextProvider>
      <NewWords/> 
    </PageContextProvider>
    : 
    <div>you must login to access this feature</div>
  )
}