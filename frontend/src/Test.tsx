import { useState } from "react";

function B({a}: {a:boolean}) {

  return (
    <>
      <div>{a}</div>
    </>
  )
}

function A({a} : {a:boolean}) {

  const [b, setB] = useState(false)
  

  return (
    <>
      <div>{a ? 't' : 'f'}</div>
      <div>{b ? 't' : 'f'}</div>
      <button onClick={() => setB(!b)}>inc b</button>
    </>
    
  )
}

export function Test() {
  const [a, setA] = useState(false);
  return (
    <>
      {a ? <A a={true} /> : <A a={false}/>}
      <button onClick={() => setA(!a)}>inc a</button>
    </>
  )
}