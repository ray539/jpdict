import {useState} from "react"

export function usePersistedState<T>(defaultVal: T, storageName: string): [T, (newStateVal: T) => void] {

  const localVal = localStorage.getItem(storageName)
  const val = localVal ? JSON.parse(localVal) as T : defaultVal
  const [state, setState] = useState(val)

  const setStateVal = (newStateVal: T) => {
    setState(newStateVal)
    localStorage.setItem(storageName, JSON.stringify(newStateVal))
  }

  return [state, setStateVal]
}