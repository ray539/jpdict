import { createContext, ReactElement, useState } from "react"

interface TimeContextT {
  timeStamp: number,
  setTimeStamp: (v: number) => void
  getCurrentTimestamp: () => number
}

export const TimeContext = createContext<TimeContextT>({
  timeStamp: -1,
  setTimeStamp: () => {},
  getCurrentTimestamp: () => 1
})

export default function TimeContextProvider({children}: {children: ReactElement}) {
  const [timeStamp, setTimeStamp] = useState((new Date()).getTime());
  return (
    <TimeContext.Provider value={{
      timeStamp: timeStamp,
      setTimeStamp: setTimeStamp,
      getCurrentTimestamp: () => timeStamp // when debug mode is off, we can replace this function with 'NOW'
    }}>
      {children}
    </TimeContext.Provider>
  )
}

