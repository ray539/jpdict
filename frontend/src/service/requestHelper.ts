import axios, { AxiosResponse } from 'axios'
import {Account, Card, CardType, CardUpdateQuery, ExampleSentence, SearchResult, TDeckInfo, Word} from '../../../global'
let BASEURL = ''

/**
 * this function is mainly used for testing
 * @param s 
 */
export function setBaseUrl(s: string) {
  BASEURL = s;
}

function extractError(e: any) {
  try {
    if (e.response.data.error) {
      return {
        error: e.response.data.error
      }
    }
    return {error: 'unexpected network error'}
  } catch (e) {
    return {error: 'unexpected network error'}
  }
}

export async function login(username: string, password: string) {
  try {
    const res = await axios.get(`${BASEURL}/api/login`, {
      headers: {
        username: username,
        password: password
      }
    })    
    return res.data as Account;
  } catch (e) {
    return extractError(e)
  }
}

export async function createDeck(username: string, password: string, name: string, wordIds: string[]) {
  try {
    const res = await axios.post(`${BASEURL}/api/createDeck`,
     {
      name: name,
      wordIds: wordIds,
     },
     {
      headers: {
        username: username,
        password: password
      }
     }
    )
    return res.data as any;
  } catch (e) {
    return extractError(e)
  }
}


export async function register(username: string, password: string) {
  try {
    const res =  await axios.post(`${BASEURL}/api/register`, {
      username: username,
      password: password
    })
    return res.data as Account;
  } catch (e) {
    return extractError(e)
  }
}

export async function getDeckInfo(username: string, password: string, deckId: string) {
  try {
    const res = await axios.get(`${BASEURL}/api/getDeckInfo`, {
      headers: {
        username: username,
        password: password,
      },
      params: {
        deckId: deckId
      }
    })
    return res.data as TDeckInfo;
  } catch (e) {
    return extractError(e)
  }
}


export async function getTDeckListForUser(username: string, password: string) {
  try {
    const res = await axios.get(`${BASEURL}/api/getTDeckListForUser`, {
      headers: {
        username: username,
        password: password
      }
    })
    return res.data as TDeckInfo[];
  } catch (e) {
    return extractError(e)
  }
}

export async function deleteWordFromDeck(username: string, password: string, deckId: string, wordId: string) {
  try {
    const res = await axios.delete(`${BASEURL}/api/deleteWordFromDeck`, {
      headers: {
        username: username,
        password: password,
      },
      params: {
        deckId: deckId,
        wordId: wordId
      }
    })
    return res.data;
  } catch (e) {
    return extractError(e)
  }
}

// TODO fix this route. Wrong format
export async function deleteWordsFromDeck(username: string, password: string, deckId: string, wordIds: string[]) {
  try {
    const res = await axios.post(`${BASEURL}/api/deleteWordsFromDeck`, {
      headers: {
        username: username,
        password: password,
      },
      data: {
        deckId: deckId,
        wordIds: wordIds
      }
    })
    return res.data;
  } catch (e) {
    return extractError(e)
  }
}

/**
 * return how many words were added
 */
export async function addWordsToDeck(username: string, password: string, deckId: string, wordIds: string[]) {
  try {
    const res = await axios.post(`${BASEURL}/api/addWordsToDeck`, 
      {
        deckId: deckId,
        wordIds: wordIds
      },
      {
      headers: {
        username: username,
        password: password,
      }
    })
    return res.data as {count: number};
  } catch (e) {
    return extractError(e)
  }
}

export async function changeWordKnownLevel(username: string, password: string, wordId: string, knownLevel: number) {
  try {
    const res = await axios.put(`${BASEURL}/api/changeWordKnownLevel`, 
      {
        wordId: wordId,
        knownLevel: knownLevel
      },
      {
      headers: {
        username: username,
        password: password
      }
    })
    return res.data;
  } catch (e) {
    return extractError(e)
  }
}

export async function getWordsInDeck(username: string, password: string, deckId: string, skip: number, take: number) {
  try {
    const res = await axios.get(`${BASEURL}/api/getWordsInDeck`, 
      {
      params: {
        deckId: deckId,
        skip: skip,
        take: take
      },
      headers: {
        username: username,
        password: password,
      },
    })
    return res.data as Word[];
  } catch (e) {
    return extractError(e)
  }
}

export async function getCustomSentencesForWord(username: string, password: string, wordId: string) {
  try {
    const res = await axios.get(`${BASEURL}/api/getCustomSentencesForWord`, {
      headers: {
        username: username,
        password: password
      },
      params: {
        wordId: wordId
      }
    })
    let tmp = res.data as ExampleSentence[];
    for (let x of tmp) {
      x.custom = true;
    }
    return tmp;
  } catch (e) {
    return extractError(e)
  }
}

export async function addCustomSentenceForWord(username: string, password: string, wordId: string, jpn: string, eng: string, wordForm: string) {
  try {
    const res = await axios.post(`${BASEURL}/api/addCustomSentenceForWord`, 
      {
        wordId: wordId,
        jpn: jpn,
        eng: eng,
        wordForm: wordForm
      },
      {
          headers: {
            username: username,
            password: password
          }
      }
    )
    return res.data
  } catch(e) {
    return extractError(e)
  }
}

export async function deleteCustomSentenceForWord(username: string, password: string, customSentenceId: string) {
  try {
    const res = await axios.delete(`${BASEURL}/api/deleteCustomSentenceForWord`, {
      headers: {
        username: username,
        password: password
      },
      params: {
        customSentenceId: customSentenceId,
      }
    })
    return res.data
  } catch (e) {
    return extractError(e)
  }
}

export async function getWord(username: string, password: string, wordId: string) {
  try {
    const res = await axios.get(`${BASEURL}/api/getWord`, 
      {
      params: {
        wordId: wordId
      },
      headers: {
        username: username,
        password: password,
      },
    })
    if (res.data) {
      return res.data as Word;
    } else {
      return {error: 'word not found'}
    }
    
  } catch (e) {
    return extractError(e)
  }
}

function fixDatesOnCard(card: Card) {
  card.lastReviewed = card.lastReviewed ? new Date(card.lastReviewed) : null;
  card.timeDue = new Date(card.timeDue)
  card.dateAdded = new Date(card.dateAdded)
  return card;
}

export async function getCard(username: string, password: string, cardId: string) {
  try {
    const res = await axios.get(`${BASEURL}/api/getCard`, 
      {
      params: {
        cardId: cardId
      },
      headers: {
        username: username,
        password: password,
      },
    })
    if (res.data) {
      const ret = fixDatesOnCard(res.data);
      return ret;
    } else {
      return {error: 'card not found'}
    }
    
  } catch (e) {
    return extractError(e)
  }
}

export async function wordIdsToWords(username: string, password: string, wordIds: string[]) {
  try {
    // console.log(username, password, strategy, timestamp);
    
    const res = await axios.get(`${BASEURL}/api/wordIdsToWords`, {
      headers: {
        username: username,
        password: password
      },
      params: {
        wordIds: wordIds,
      }
    })
    return res.data as Word[];
  } catch (e) {
    return extractError(e)
  }
}

export async function getNewWordsList(username: string, password: string, strategy: string, timestamp: number) {
  try {
    console.log(username, password, strategy, timestamp);
    
    const res = await axios.get(`${BASEURL}/api/getNewWordsList`, {
      headers: {
        username: username,
        password: password
      },
      params: {
        strategy: strategy,
        timestamp: timestamp
      }
    })
    return res.data as Word[];
  } catch (e) {
    return extractError(e)
  }
}

export async function updateNewWordsList(username: string, password: string, wordIds: string[]) {
  try {
    // console.log(username, password, strategy, timestamp);
    
    const res = await axios.put(`${BASEURL}/api/updateNewWordsList`, {
      headers: {
        username: username,
        password: password
      },
      data: {
        wordIds: wordIds
      }
    })
    return res.data as any;
  } catch (e) {
    return extractError(e)
  }
}

export async function getWordKnownLevel(username: string, password: string, wordId: string) {
  try {
    const res = await axios.get(`${BASEURL}/api/getWordKnownLevel`, {
      headers: {
        username: username,
        password: password
      },
      params: {
        wordId: wordId
      }
    })
    return res.data as string;
  } catch (e) {
    return extractError(e)
  }
}

export async function getExampleSentencesForWord(username: string, password: string, wordId: string) {
  try {
    const res = await axios.get(`${BASEURL}/api/getExampleSentencesForWord`, {
      headers: {
        username: username,
        password: password
      },
      params: {
        wordId: wordId
      }
    })
    let tmp = res.data as ExampleSentence[];
    for (let x of tmp) {
      x.custom = false;
    }
    return tmp;
  } catch (e) {
    return extractError(e)
  }
}

export async function getCardsForWord(username: string, password: string, wordId: string) {
  try {
    const res = await axios.get(`${BASEURL}/api/getCardsForWord`, {
      headers: {
        username: username,
        password: password
      },
      params: {
        wordId: wordId
      }
    })
    return (res.data as Card[]).map(c => fixDatesOnCard(c));
  } catch (e) {
    return extractError(e)
  }
}

export async function createCard(username: string, password: string, card: Card, cardType: CardType) {
  try {
    const res = await axios.post(`${BASEURL}/api/createCard`, 
      {
        card: card,
        cardType: cardType
      },
      {
        headers: 
        {
          username: username,
          password: password
        },
    })
    return fixDatesOnCard(res.data);
  } catch (e) {
    return extractError(e)
  }
}

export async function updateCard(username: string, password: string, cardId: string, newCard: Card) {
  try {
    const res = await axios.put(`${BASEURL}/api/updateCard`, {
      headers: {
        username: username,
        password: password
      },
      data: {
        cardId: cardId,
        newCard: newCard
      }
    })
    return fixDatesOnCard(res.data);
  } catch (e) {
    return extractError(e)
  }
}

export async function updateCards(username: string, password: string, cardIds: string[], newCard: CardUpdateQuery) {
  try {
    const res = await axios.put(`${BASEURL}/api/updateCards`, 
      {
        cardIds: cardIds,
        newCard: newCard
      },
      {
        headers: {
          username: username,
          password: password
        }
      }
    );
  } catch (e) {
    return extractError(e)
  }
}



export async function deleteCard(username: string, password: string, cardId: string) {
  try {
    const res = await axios.delete(`${BASEURL}/api/deleteCard`, {
      headers: {
        username: username,
        password: password
      },
      params: {
        cardId: cardId,
      }
    })
    return fixDatesOnCard(res.data);
  } catch (e) {
    return extractError(e)
  }
}


// ATTEMPT AT CONTROLLING THE DATE

// export async function now() {
//   try {
//     const res = await axios.get(`${BASEURL}/api/now`);
//     return Number(res.data);
//   } catch (e) {
//   }
// }

// export async function incrementDays(d: number) {
//   try {
//     const res = await axios.get(`${BASEURL}/api/incrementDays`, {
//       params: {
//         d: d
//       }
//     });
//   } catch (e) {
//   }
// }

// export async function incrementHours(d: number) {
//   try {
//     const res = await axios.get(`${BASEURL}/api/incrementHours`, {
//       params: {
//         d: d
//       }
//     });
//   } catch (e) {
//   }
// }

// export async function resetTo(d: number) {
//   try {
//     const res = await axios.get(`${BASEURL}/api/resetTo`, {
//       params: {
//         d: d
//       }
//     });
//   } catch (e) {
//   }
// }

export async function getDueCards(username: string, password: string, timestamp: number, limit: number) {
  try {
    const res = await axios.get(`${BASEURL}/api/getDueCards`, {
      headers: {
        username: username,
        password: password
      },
      params: {
        timestamp: timestamp,
        limit: limit
      }
    })

    const ret = (res.data as Card[]).map((c: Card) => fixDatesOnCard(c));
    return ret;
  } catch (e) {
    return extractError(e)
  }
}

export async function searchDictionary(username: string, password: string, queryStr: string, skip: number, take: number) {
  try {
    const res = await axios.get(`${BASEURL}/api/searchDictionary`, {
      headers: {
        username: username,
        password: password
      },
      params: {
        queryStr: queryStr,
        skip: skip,
        take: take
      }
    })

    const ret = res.data as SearchResult[] 
    return ret;
  } catch (e) {
    return extractError(e)
  }
}

export async function getWordsSimilarToWord(username: string, password: string, wordId: string) {
  try {
    const res = await axios.get(`${BASEURL}/api/getWordsSimilarToWord`, {
      headers: {
        username: username,
        password: password
      },
      params: {
        wordId: wordId
      }
    })
    return res.data as Word[]
  } catch (e) {
    return extractError(e)
  }
}

export async function updateWordsSimilarToWord(username: string, password: string, wordId: string, newSimWordIds: string[]) {
  try {
    const res = await axios.post(`${BASEURL}/api/updateWordsSimilarToWord`, 
      {
        wordId: wordId,
        newSimWordIds: newSimWordIds
      },
      {
        headers: 
        {
          username: username,
          password: password
        },
    })
    return res.data
  } catch (e) {
    console.log(e);
    
    return extractError(e)
  }
}

export async function setWordsToAdd(username: string, password: string, newWordsToAdd: string[]) {
  try {
    const res = await axios.post(`${BASEURL}/api/setWordsToAdd`, 
      {
        newWordsToAdd: newWordsToAdd
      },
      {
        headers: 
        {
          username: username,
          password: password
        },
    })
    return res.data
  } catch (e) {
    console.log(e);
    
    return extractError(e)
  }
}

export async function getWordsToAdd(username: string, password: string) {
  try {
    const res = await axios.get(`${BASEURL}/api/getWordsToAdd`, 
      {
        headers: 
        {
          username: username,
          password: password
        },
    })
    return res.data as Word[]
  } catch (e) {
    console.log(e);
    return extractError(e)
  }
}

export async function extractFromTextAndSetWordsToAdd(username: string, password: string, text: string) {
  try {
    const res = await axios.post(`${BASEURL}/api/extractFromTextAndSetWordsToAdd`, 
      {
        text: text
      },
      {
        headers: 
        {
          username: username,
          password: password
        },
    })
    return res.data
  } catch (e) {
    console.log(e);
    
    return extractError(e)
  }
}