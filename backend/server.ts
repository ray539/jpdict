import express from 'express'
import { PrismaClient } from "@prisma/client";
import 'express-async-errors'
import morgan from 'morgan'

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
  const found = await prisma.word.findFirst({where: {id: wordId}})
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

const PORT = process.env.PORT || 3004
app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}`);
  
})