

function Temp() {
  return (
    <div style={{border: '1px solid red', minHeight: '30vh', padding:'1em', display: 'flex'}}>
      {/* left bar */}
      <div style={{border: '1px solid black', padding: '0.5em', minWidth: '10em', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{width: '100%'}}>
          <div style={{border: '1px solid black', textWrap: 'nowrap', marginBottom: '1em', padding: '0.5em'}}>
            <b>word markings: </b>
            <div>✔: known word</div>
            <div>🎯: daily word</div>
          </div>
          {
            words ?
              words.length > 0 ?
                words.map((word, i) => {
                  return (
                    <div 
                      key={word.id} 
                      style={
                        {
                          border: '1px solid black', 
                          width: '100%', 
                          backgroundColor: wordIdx === i ? 'limegreen' : 'whitesmoke', 
                          fontSize: '25px'
                        }
                      }
                      onClick={() => setWordIdx(i)}
                    >
                    <span style={{fontSize: '20px'}}>{i + 1}.</span> {word.kanji}
                    {
                      word.knownLevel != undefined ? '✔' : ''
                    }
                    </div>
                  )

                })
              :
              <div>this list is empty</div>
            :
              <div>fetching...</div>
          }
        </div>
        
        <div style={{width: '100%'}}>
          <button 
            style={{width: '100%'}}
            onClick={() => {
              navigate('edit/from-deck')
            }}
          >edit list ✎</button>
        </div>
        
      </div>

      right page
      <div style={{border: '1px solid black', width: '100%'}}>
        {
          displayedWord ?
          <WordView 
            key={displayedWord.id} 
            word={displayedWord}
            otherButtons={[
            <button 
              style={{backgroundColor: 'lightblue'}} 
              onClick={async (e) => {
                window.open(`/cards-for-word/?wordId=${displayedWord.id}&autoCreate=true`)
                if (displayedWord.knownLevel== undefined) {
                  // update known level of word, if it is not already known
                  await changeWordKnownLevel(acct.username, acct.password, displayedWord.id, 0)
                  const newWord = structuredClone(displayedWord);
                  newWord.knownLevel = 0
                  setWords(words!.slice(0, wordIdx).concat([newWord]).concat(words!.slice(wordIdx + 1)));
                }
              }}
            >
              mark as learnt and create card
            </button>,
            <button style={{backgroundColor: 'lightblue'}}>add word to deck</button>
            ]}
          />
          :
          <div>select a word to display it</div>
        }
      </div>
    </div>
  )
}
  