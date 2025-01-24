import 'bootstrap/dist/css/bootstrap.min.css';
import { useContext, useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import AuthContextProvider, { AuthContext } from './context/AuthContextProvider';
import { Account, Card, TDeckInfo, Word } from '../../global';
import { getTDeckListForUser_service, register_service } from './service/service';
import { getCardsForWord, getExampleSentencesForWord } from './service/requestHelper';
import { A } from './A';
import { NewWords, NewWords_ } from './NewWords';
import { ReviewCards, ReviewCards_ } from './ReviewCards';
import TimeContextProvider, { TimeContext } from './context/TimeContextProvider';
import { Dashboard_ } from './DashBoard';
import { BrowseDeck_ } from './BrowseDeck';
import { Search_ } from './Search';
import { WordDetails_ } from './WordDetails';
import { CardsForWord_ } from './CardsForWord';
import { NewWords2_ } from './NewWords2';
import { AddsWordsToDeck_ } from './AddWordsToDeck';
// DEBUG
// import { increment_days, increment_hours, now_ } from './stubDate';

function Links() {
  const authContext = useContext(AuthContext)
  const timeContext = useContext(TimeContext)

  const navigate = useNavigate();
  const loggedIn_page =     
  <>
    <button onClick={e => {
      authContext.logout()
      navigate("/")
    }}>
      logout
    </button>
    <Link to="/dashboard">
      <button>dashboard</button>
    </Link>
    <Link to="/search">
      <button>search dictionary</button>
    </Link>
    <Link to="/">
      <button>logo</button>
    </Link>
  </>

  const notloggedIn_page =
  <>
    <Link to="/login">
      <button>login</button>
    </Link>
    <Link to="/register">
      <button>register</button>
    </Link>
    <Link to="/dashboard">
      <button disabled>login to view dashboard</button>
    </Link>
    <Link to="/">
      <button>logo</button>
    </Link>
  </>

  return (
    <>
      
      <div style={{border: '1px solid blue', padding: '0.5em', marginBottom: '1em'}}>
        DEBUG
        <div>curr time: {new Date(timeContext.getCurrentTimestamp()).toLocaleString()}</div>
        <div>timestamp: {timeContext.getCurrentTimestamp()}</div>
        <button onClick={() => {timeContext.setTimeStamp(timeContext.getCurrentTimestamp() + 3600 * 1000)}}>inc hour</button>
        <button onClick={() => {timeContext.setTimeStamp(timeContext.getCurrentTimestamp() + 24 * 3600 * 1000)}}>inc day</button>
        <button onClick={() => {timeContext.setTimeStamp(timeContext.getCurrentTimestamp() + 60 * 1000)}}>inc minute</button>
      </div>
      {authContext.account ? loggedIn_page : notloggedIn_page}
    </>

    
  )
}

function LandingPage() {
  return (
    <h1>Landing Page</h1>
  )
}

function LoginPage() {
  const authContext = useContext(AuthContext)

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  return (
    <>
      {
        authContext.account ?
        <div>you are already logged in</div>
        :
        <>
          <h1>Login Page</h1>
          <div>username</div>
          <input type="text" onChange={e => setUsername(e.target.value)} value={username}></input>
          <div>password</div>
          <input type="password" onChange={e => setPassword(e.target.value)} value={password}></input>
          <div>
            <button type='submit' onClick={ async(e) => {
              const res = await authContext.login({username, password})
              if ('error' in res) {
                window.alert(res.error)
                setUsername('')
                setPassword('')
                return;
              }

              navigate('/dashboard')
            }}>
              login
            </button>
          </div>
        </>
      }
    </>
  )
}

function Reigster() {
  const authContext = useContext(AuthContext)

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  return (
    <>
      {
        authContext.account ?
        <div>you are already logged in</div>
        : 
        <>
          <h1>Register Page</h1>
          <div>username</div>
          <input type="text" onChange={e => setUsername(e.target.value)} value={username}></input>
          <div>password</div>
          <input type="password" onChange={e => setPassword(e.target.value)} value={password}></input>
          <div>
            <button type='submit' onClick={async (e) => {
              const createdAccnt = await register_service(username, password)
              if ('error' in createdAccnt) {
                window.alert(createdAccnt.error)
                return;
              }
              authContext.login({username: createdAccnt.username, password: createdAccnt.password})
              navigate('/dashboard')
            }}>
              register
            </button>
          </div>
        </>
      }
    </>
  )
}



function App() {
  return (
    <>
      <AuthContextProvider>
        <TimeContextProvider>
          <>
            <Links />
            <Routes>
              <Route path="/" element={<LandingPage />}/>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<Reigster />} />
              <Route path="/dashboard" element={<Dashboard_/>} />
              <Route path="/search" element={<Search_ />} />
              <Route path="/new-words/*" element={<NewWords_/>} />
              <Route path="/new-words2/*" element={<NewWords2_ />} />
              <Route path="/review-cards/*" element={<ReviewCards_ />} />
              <Route path="/browse-deck/*" element={<BrowseDeck_ />} />
              <Route path="/word-details/*" element={<WordDetails_ />} />
              <Route path="/cards-for-word/*" element={<CardsForWord_ />}/>
              <Route path="/add-words-to-deck/*" element={<AddsWordsToDeck_/>}></Route>
              <Route path="/a/:wordId" element={<A/>} />
              <Route path="*" element={<div>App.tsx: page not found</div>}/>
            </Routes>
          </>
        </TimeContextProvider>
      </AuthContextProvider>
    </>
  )
}

export default App
