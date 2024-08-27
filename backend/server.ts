import express from 'express'
import { Prisma, PrismaClient } from "@prisma/client";
import 'express-async-errors'
import morgan from 'morgan'
import { increment_days, increment_hours, now_ } from './common';

const prisma = new PrismaClient();
const app = express()
app.use(morgan('short'))
app.use(express.json())

async function loginAccount(username: string, password: string) {
  const account = await prisma.account.findFirst({
    where: {
      username: username,
      password: password
    }
  })
  return account;
}

// attempts to login account
app.get('/api/login', async (req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (foundAccnt) {
    return res.json(foundAccnt)
  }
  return res.status(403).json({error: `username / password incorrect`})
})

/**
 * 
 * @param accountId of the owner 
 * @param name of the deck
 * @param wordIds list of wordIds
 */
async function createDeck(accountId: string, name: string, priority: number, wordIds: string[]) {
  const deck = await prisma.wordDeck.create({
    data: {
      name: name,
      priority: priority,
      accountId: accountId
    }
  })
  const data = wordIds.map((wordId, i) => {
    return {
      wordId : wordId,
      wordDeckId: deck.id,
      seqNum: i
    }
  })

  await prisma.belongsToWordDeck.createMany({
    data: data
  });
}

app.post('/api/register', async (req, res) => {
  const body = req.body;
  const username = body.username;
  const password = body.password;

  let existing = await prisma.account.findFirst({where: {username: username}})
  if (existing) {
    return res.status(403).json({error: `account with username '${username}' already exists`})
  }

  const newAccount = await prisma.account.create({
    data: {
      username: username,
      password: password,
    }
  })

  // create the initial deck for the account
  const fst30Words = (await prisma.word.findMany({take: 30})).map(word => word.id);
  await createDeck(newAccount.id, 'initialDeck', 1, fst30Words)
  return res.json(newAccount);
})

/**
 * returns:
 * {
 *  "name": string
 *  "totalWords": Int
 *  "knownWords": Int
 * }
 */
app.get('/api/getTDeckListForUser', async(req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }

  // targetDeck:
  //   totalWords
  //   knownWords
  const decks1 = await prisma.wordDeck.findMany({
    where: {
      accountId: foundAccnt.id
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          words: true
        }
      }
    }
  })

  const decks2 = await Promise.all(decks1.map(async (obj) => {
    const deckId = obj.id
    // get all words in the deck with known level which is not new
    const knownWords = await prisma.belongsToWordDeck.findMany({
      where: {
        wordDeckId: deckId,
        word: {
          knownByAccount: {
            some: {
              accountId: {
                equals: foundAccnt.id,
              },
              knownLevel: {
                in: ['1', '2', '3', '4', '5']
              }
            }
          }
        }  
      },
    })

    return {
      id: obj.id,
      name: obj.name,
      totalWords: obj._count.words,
      knownWords: knownWords.length
    }
  }))

  res.json(decks2)
})

app.put('/api/changeWordKnownLevel', async (req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }

  const wordId = req.body.wordId as string
  const knownLevel = req.body.knownLevel as string
  console.log(wordId);
  console.log(knownLevel);
  
  
  const found = await prisma.word.findFirst({where: {id: wordId}})
  console.log(found);
  
  if (!found) {
    return res.status(403).json({error: 'wordId not found'})
  }
  

  if (!['0', '1', '2', '3', '4', '5'].includes(knownLevel)) {
    return res.status(403).json({error: 'invalid known level'})
  }
  const ret = await prisma.wordKnownLevel.upsert({
    where: {
      accountId_wordId: {
        accountId: foundAccnt.id,
        wordId: wordId
      }
    },
    update: {
      knownLevel: knownLevel
    },
    create: {
      accountId: foundAccnt.id,
      wordId: wordId,
      knownLevel: knownLevel,
    }
  })
  res.json(ret)
})

/**
 * return list of word information (including id and all that)
 */
app.get('/api/getWordsInDeck', async(req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }
  const deckId = req.body.deckId

  const words_ = await prisma.wordDeck.findUnique({
    where: {
      id: deckId,
      accountId: foundAccnt.id
    },
    select: {
      words: {
        select: {
          word: true
        }
      }
    }
  })
  if (!words_) {
    return res.status(403).json({error: 'deck not found'})
  }

  const words = words_.words.map(obj => obj.word);
  return res.json(words)
})

/**
 * body: {
 *  strategy: string
 *  timestamp: string
 * }
 * should be in body, since headers only accepts string type
 */
app.get('/api/getNewWordsList', async (req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }

  const strategy = req.body.strategy as string
  const timestamp = req.body.timestamp as unknown as number
  const now = new Date(timestamp)

  // find the existing new word list entry
  const newWordList = await prisma.newWordList.findUnique({where: {
    accountId: foundAccnt.id
  }})

  const DAY_LENGTH = 24 * 3600 * 1000
  const NUM_NEW_WORDS = 10

  if (newWordList && now.getTime() - newWordList.date.getTime() <= DAY_LENGTH) {
    console.log('return cached');
    return res.json(newWordList.wordList)
  }

  // x is null, or it is too late
  if (strategy == 'HIGHEST PRIO') {
    console.log('get new list');
    const deck = await prisma.wordDeck.findFirst({
      where: {
        priority: 1,
        accountId: foundAccnt.id
      }
    })
    if (!deck) {
      return res.json({msg: 'no target decks found'})
    }
    const words_ = await prisma.belongsToWordDeck.findMany({
      where: {
        word: {
          knownByAccount: {
            none: {
              accountId: foundAccnt.id
            }
          }
        },
        wordDeckId: deck.id
      },
      select: {
        seqNum: true,
        word: true
      },
      take: NUM_NEW_WORDS
    })
    const words = words_.map(w => {
      let w2 = {...w.word, seqNum: w.seqNum}
      return w2
    })
    
    await prisma.newWordList.deleteMany({
      where: {
        accountId: foundAccnt.id
      }
    })

    await prisma.newWordList.create({
      data: {
        accountId: foundAccnt.id,        
        date: now,
        wordList: (words as Prisma.JsonArray)
      }
    })

    res.json(words)
  } else if (strategy == 'RANDOM') {
    // const decks = await prisma.wordDeck.findMany({
    //   where: {
    //     accountId: foundAccnt.id
    //   },
    //   select: {
    //     priority: true
    //   }
    // })
    // const nums = decks.map(d => d.priority)
    // if (nums.length == 0) {
    //   res.json({msg: 'no target decks found'})
    // }
    // nums.sort()
    res.status(403).json({error: 'TODO'})
  } else {
    return res.status(403).json({error: `strategy must be 'HIGHEST PRIO' or 'RANDOM'`})
  }
})


const PORT = process.env.PORT || 3004
app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}`);
  
})