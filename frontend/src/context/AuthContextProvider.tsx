import { createContext, ReactElement, useEffect, useState } from "react";
import { Account, Login } from "../common";
import { usePersistedState } from "./PersistedState";
import React from 'react'
import { login_service, MyError } from "../service/service";


interface AuthContextT {
  account: Account | null
  login: (login: Login) => Promise<Account | MyError>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextT>({
  account: null,
  login: async () => {return {error: ''}},
  logout: async () => {}
})

export default function AuthContextProvider({children}: {children: ReactElement}) {
  const [local_login, local_setLogin] = usePersistedState<Login | null>(null, 'login')
  const [account, setAccount] = useState<Account | null>(null);

  const login = async (login: Login) => {
    const res = await login_service(login.username, login.password)
    if ('error' in res) {
      return res;
    }
    const accnt = res
    setAccount(accnt)
    local_setLogin({
     username: accnt.username,
     password: accnt.password
    })
    return accnt
  }

  const logout = async () => {
    local_setLogin(null)
    setAccount(null)
  }

  useEffect(() => {
    if (local_login) {
      const res = login(local_login)
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      account: account,
      login: login,
      logout: logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}