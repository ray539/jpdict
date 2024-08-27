import 'bootstrap/dist/css/bootstrap.min.css';
import { useContext, useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import AuthContextProvider, { AuthContext } from './context/AuthContextProvider';
import { TDeckInfo } from '../../global';
import { getTDeckListForUser_service, register_service } from './service/service';

function Links() {
  const authContext = useContext(AuthContext)
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
    authContext.account ? loggedIn_page : notloggedIn_page
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

function Dashboard_loggedIn() {
  const authContext = useContext(AuthContext)
  const [tDeckInfo, setTDeckInfo] = useState<TDeckInfo[] | null>(null);
  
  // get the decks for the user
  useEffect(() => {
    const todo = async () => {
      const res = await getTDeckListForUser_service(authContext.account?.username as string, authContext.account?.password as string );
      if ('error' in res) {
        window.alert(res.error);
        setTDeckInfo([])
        return;
      }
      setTDeckInfo(res);
    }
    todo();
  }, [])

  return (
    <>
      <h1>Dashboard</h1>
      <div>
        Your current learning progress is
      </div>
      <div style={{fontSize: 50}}>
        50%
      </div>
      <div>you haven't completed your daily goal of 10 new words yet</div>
      <div>
        <Link to="/new-words">
          <button>learn new words</button>
        </Link>
        
      </div>
      <div>
        <button>review due cads</button>
      </div>
      <h2>target word decks</h2>
      {
        tDeckInfo ?
          tDeckInfo.length > 0 ?
            tDeckInfo.map(tdeckInfo => {
              return <div style={{border: '1px solid black'}}>
                <div>
                  name: {tdeckInfo.name}
                </div>
                <div>
                  totalWords: {tdeckInfo.totalWords}
                </div>
                <div>
                  knownWords: {tdeckInfo.knownWords}
                </div>
              </div>
            })
          :
          <div>you have no target decks</div>
        :
          <div>fetching...</div>
     }
    </>
  )
}

function Dashboard() {
  const authContext = useContext(AuthContext)

  return (
    authContext.account ? <Dashboard_loggedIn /> : <div>you must login to access this feature</div>
  )
}

function NewWords_loggedIn() {
  return (
    <>
      <h1>learn new words</h1>
      <div style={{display: 'flex', height: '90vh', border: '1px solid red'}}>
        <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column', border: '1px solid black', minWidth: '5em', margin: '1em'}}>
          <div style={{border: '1px solid black', paddingLeft: '0.5em', paddingRight: '0.5em', margin: '1em'}}>item1</div>
        </div>

        <div style={{border: '1px solid black', width: '100%', margin: '1em', padding: '1em'}}>
          <div>create flashcard for</div>
          <h1 style={{fontSize: 50}}>word</h1>
          <div>reading: </div>
          <div>other readings: </div>
          <div>defnitions: </div>
          <ol>
            <li>def1</li>
            <li>def2</li>
            <li>def3</li>
          </ol>
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
            <div style={{border: '1px solid black', paddingLeft: '0.5em', paddingRight: '0.5em', margin: '1em'}}>sentence 1</div>
          </div>
        </div>
      </div>
    </>
  )
}


function NewWords() {
  const authContext = useContext(AuthContext);
  return (
    authContext.account ? <NewWords_loggedIn/> : <div>you must login to access this feature</div>
  )
}

function App() {
  return (
    <>
      <AuthContextProvider>
        <>
          <Links />
          <Routes>
            <Route path="/" element={<LandingPage />}/>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Reigster />} />
            <Route path="/dashboard" element={<Dashboard/>} />
            <Route path="/new-words" element={<NewWords />} />
            <Route path="*" element={<div>not found</div>}/>
          </Routes>
        </>
      </AuthContextProvider>

    </>
  )
}

export default App
