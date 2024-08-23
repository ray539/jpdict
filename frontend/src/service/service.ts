import axios from 'axios'
import { Account } from '../common';

export interface MyError {
  error: string
}

/**
 * 
 * @param e axios error
 * @returns if successful, object in form {error: string}
 */
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

export async function register_service(username: string, password: string) {
  try {
    const res = await axios.post('/api/register', {
      username: username,
      password: password
    })
    
    return res.data as Account;
  } catch (e) {
    return extractError(e)
  }
}

export async function login_service(username: string, password: string) {
  try {
    const res = await axios.get('/api/login', {
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

export async function getTDeckListForUser_service(username: string, password: string) {
  
}

export async function  changeWordKnownLevel_service(username: string, password: string) {
  try {
    const res = await axios.put('/api/changeWordKnownLevel', {
      
    })
  } catch (e) {
    return extractError(e)
  }
}