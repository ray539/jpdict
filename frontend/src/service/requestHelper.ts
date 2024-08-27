import axios, { AxiosResponse } from 'axios'
import {Account, TDeckInfo, Word} from '../../../global'
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

export async function changeWordKnownLevel(username: string, password: string, wordId: string, knownLevel: string) {
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

export async function getWordsInDeck(username: string, password: string, deckId: string) {
  try {
    const res = await axios.get(`${BASEURL}/api/getWordsInDeck`, 
      {
      headers: {
        username: username,
        password: password
      },
      data: {
        deckId: deckId
      },
    })
    return res.data as Word[];
  } catch (e) {
    return extractError(e)
  }
}

export async function getNewWordsList(username: string, password: string, strategy: string, timestamp: number) {
  try {
    const res = await axios.get(`${BASEURL}/api/getNewWordsList`, {
      headers: {
        username: username,
        password: password
      },
      data: {
        strategy: strategy,
        timestamp: timestamp
      }
    })
    return res.data as Word[];
  } catch (e) {
    return extractError(e)
  }
}
