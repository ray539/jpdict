import express from 'express'
import { Prisma, PrismaClient } from "@prisma/client";
import 'express-async-errors'
import morgan from 'morgan'
import { objectEnumNames } from '@prisma/client/runtime/library';
import { Account } from '../global';
import { log } from 'console';
import { equal } from 'assert';
import { searchDictionary } from './search';
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

//TODO!!!
app.post('/api/createDeck', async (req, res) => {

})

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
  const fst30Words = (await prisma.word.findMany({take: 100})).map(word => word.id);
  await createDeck(newAccount.id, 'initialDeck', 1, fst30Words)
  return res.json(newAccount);
})

app.get('/api/getDeckInfo', async(req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const deckId = req.headers.deckId as string
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }

  const decks1 = await prisma.wordDeck.findMany({
    where: {
      id: deckId
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          words: true
        },
      }
    }
  })
  const decks2 = await prisma.wordDeck.findMany({
    where: {
      id: deckId
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          words: {
            where: {
              word: {
                knownByAccount: {
                  some: {
                    knownLevel: {
                      notIn: ["0"]
                    }
                  }
                }
              }
            }
          }
        },
      }
    }
  })

  const deckList = decks1.map((o, i) => {
    return {
      id: o.id,
      name: o.name,
      totalWords: o._count.words,
      knownWords: decks2[i]._count.words
    }
  })

  // console.log('here server');
  

  return res.json(deckList[0])
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
  // NOTE: we cannot have multiple count fields
  // https://github.com/prisma/prisma/discussions/17676
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
        },
      }
    }
  })

  const decks2 = await prisma.wordDeck.findMany({
    where: {
      accountId: foundAccnt.id
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          words: {
            where: {
              word: {
                knownByAccount: {
                  some: {
                    knownLevel: {
                      notIn: ["0"]
                    }
                  }
                }
              }
            }
          }
        },
      }
    }
  })

  const deckList = decks1.map((o, i) => {
    return {
      id: o.id,
      name: o.name,
      totalWords: o._count.words,
      knownWords: decks2[i]._count.words
    }
  })

  res.json(deckList)
})

app.delete('/api/deleteWordFromDeck', async (req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }
  const deckId = req.query.deckId as string;
  const wordId = req.query.wordId as string;
  console.log(username);
  console.log(password);
  console.log(deckId);
  console.log(wordId);
  
  // relabel seqnums...
  const newWordIds_ = await prisma.belongsToWordDeck.findMany({
    where: {
      wordDeckId: deckId,
      wordId: {
        not: wordId
      }
    },
    select: {
      wordId: true
    },
    orderBy: {
      seqNum: 'asc'
    }
  })
  await prisma.belongsToWordDeck.deleteMany({
    where: {
      wordDeckId: deckId
    }
  })
  
  const data = newWordIds_.map((obj, i) => {
    return {
      wordId: obj.wordId,
      wordDeckId: deckId,
      seqNum: i,
    }
  });
  await prisma.belongsToWordDeck.createMany({
    data: data
  });
  res.json({msg: 'OK'})
})

/**
 * given a list of wordIds, delete them all
 */
app.post('/api/deleteWordsFromDeck', async (req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }
  const deckId = req.body.deckId as string
  const wordIds = req.body.wordIds as string[]

  // relabel seqnums...
  const newWordIds_ = await prisma.belongsToWordDeck.findMany({
    where: {
      wordDeckId: deckId,
      wordId: {
        notIn: wordIds
      },
    },
    select: {
      wordId: true
    },
    orderBy: {
      seqNum: 'asc'
    }
  })
  await prisma.belongsToWordDeck.deleteMany({
    where: {
      wordDeckId: deckId
    }
  })
  
  const data = newWordIds_.map((obj, i) => {
    return {
      wordId: obj.wordId,
      wordDeckId: deckId,
      seqNum: i,
    }
  });
  await prisma.belongsToWordDeck.createMany({
    data: data
  });
  res.json({msg: 'OK'})
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
  

  if (!['null', '0', '1', '2', '3', '4', '5'].includes(knownLevel)) {
    return res.status(403).json({error: 'invalid known level'})
  }

  if (knownLevel == 'null') {
    console.log('here');
    const ret = await prisma.wordKnownLevel.deleteMany({
      where: {
        accountId: foundAccnt.id,
        wordId: wordId
      }
    })
    return res.json(ret)
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
 * I also want it to return the known level of each word
 */
app.get('/api/getWordsInDeck', async(req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }
  const deckId = req.query.deckId as string

  const skip = Number(req.query.skip)
  const take = Number(req.query.take);

  console.log(username, password, deckId);
  const words_ = await prisma.wordDeck.findUnique({
    where: {
      id: deckId,
      accountId: foundAccnt.id
    },
    select: {
      words: {
        select: {
          word: {
            include: {
              knownByAccount: {
                where: {
                  accountId: foundAccnt.id
                },
                select: {
                  knownLevel: true
                }
              }
            }
          },
          seqNum: true,
        },
        orderBy: {
          seqNum: 'asc'
        },
        skip: skip,
        take: take
      }
    }
  })
  if (!words_) {
    return res.status(403).json({error: 'deck not found'})
  }
  const words = words_.words.map(obj => {
    let retObj = {...obj.word, 
      seqNum: obj.seqNum,
      knownLevel: obj.word.knownByAccount.length > 0 ? obj.word.knownByAccount[0].knownLevel : undefined   
    }
    delete (retObj as any).knownByAccount;
    return retObj
  });
  return res.json(words)
})


async function wordIdsToWords(wordIds: string[], account: any) {
  const words_ = await prisma.word.findMany({
    where: {
      id: {
        in: wordIds
      }
    },
    include: {
      knownByAccount: {
        where: {
          accountId: {
            equals: account.id
          }
        },
        select: {
          knownLevel: true
        }
      }
    }
  })
  const words = words_.map(w => {
    let retObj = {
      ...w,
      knownLevel: w.knownByAccount.length > 0 ? w.knownByAccount[0].knownLevel : undefined 
    }
    delete (w as any).knownByAccount;
    return retObj
  })
  return words
}

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

  const strategy = req.query.strategy as string
  const timestamp_ = req.query.timestamp as string
  const timestamp = Number(timestamp_)

  // console.log(username, password, strategy, timestamp);

  const now = new Date(timestamp)

  // find the existing new word list entry
  const newWordList = await prisma.newWordList.findUnique({where: {
    accountId: foundAccnt.id
  }})

  const DAY_LENGTH = 24 * 3600 * 1000
  const NUM_NEW_WORDS = 10

  if (newWordList && now.getTime() - newWordList.date.getTime() <= DAY_LENGTH) {
    console.log('return cached');
    const newWordIds = newWordList.wordList as string[];
    const cachedWords = await wordIdsToWords(newWordIds, foundAccnt);
    return res.json(cachedWords)
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
        wordId: true
      },
      orderBy: {
        seqNum: 'asc'
      },
      take: NUM_NEW_WORDS
    })
    const wordIds = words_.map(obj => obj.wordId);
    await prisma.newWordList.deleteMany({
      where: {
        accountId: foundAccnt.id
      }
    })
    await prisma.newWordList.create({
      data: {
        accountId: foundAccnt.id,        
        date: now,
        wordList: wordIds
      }
    })
    const words = await wordIdsToWords(wordIds, foundAccnt);
    res.json(words)
  } else if (strategy == 'RANDOM') {
    res.status(403).json({error: 'TODO'})
  } else {
    return res.status(403).json({error: `strategy must be 'HIGHEST PRIO' or 'RANDOM'`})
  }
})

app.put('/api/updateNewWordsList', async (req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }
  const wordIds = req.body.data.wordIds;
  const ret = await prisma.newWordList.update({
    where: {
      accountId: foundAccnt.id
    },
    data: {
      wordList: wordIds
    }
  })
  res.json(ret)
})

app.get('/api/getWordKnownLevel', async(req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }

  const wordId = req.query.wordId as string
  const knownLevel_ = await prisma.wordKnownLevel.findUnique({
    where: {
      accountId_wordId: {
        accountId: foundAccnt.id,
        wordId: wordId
      }
    },
    select: {
      knownLevel: true
    }
  })
  if (knownLevel_) {
    res.json(knownLevel_.knownLevel)
  } else {
    res.json('new')
  }
})

app.get('/api/getExampleSentencesForWord', async(req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }

  const wordId = req.query.wordId as string;
  const exampleSentences = await prisma.exampleSentence.findMany({
    where: {
      default_wordId: wordId
    }
  })

  res.json(exampleSentences)
})

app.get('/api/getCustomSentencesForWord', async(req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }
  const wordId = req.query.wordId as string
  const sentences = await prisma.customSentence.findMany({
    where: {
      accountId: foundAccnt.id,
      default_wordId: wordId
    }
  })
  res.json(sentences)
})

app.post('/api/addCustomSentenceForWord', async(req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }

  const wordId = req.body.wordId as string
  const jpn = req.body.jpn as string
  const eng = req.body.eng as string
  const wordForm = req.body.wordForm as string

  const output = await prisma.customSentence.create({
    data: {
      jpn: jpn,
      eng: eng,
      accountId: foundAccnt.id,
      default_wordId: wordId,
      default_word_wordForm: wordForm
    }
  })
  res.json(output)
})

app.delete('/api/deleteCustomSentenceForWord', async(req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }
  const customSentenceId = req.query.customSentenceId as string
  const output = await prisma.customSentence.delete({
    where: {
      id: customSentenceId
    }
  })
  res.json(output)
})



app.get('/api/getWord', async(req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }
  const wordId = req.query.wordId as string;
  const word = await prisma.word.findFirst({
    where: {
      id: wordId
    },
    include: {
      knownByAccount: {
        where: {
          accountId: foundAccnt.id
        },
        select: {
          knownLevel: true
        }
      }
    }
  })
  if (!word) {
    return res.status(403).json({error: 'word not found'})
  }
  
  let retObj = {...word,
    knownLevel: word.knownByAccount.length > 0 ? word.knownByAccount[0].knownLevel : undefined   
  }
  delete (retObj as any).knownByAccount;
  res.json(retObj)
});

app.get('/api/getCard', async(req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }
  const cardId = req.query.cardId as string;
  const word = await prisma.card.findFirst({
    where: {
      id: cardId
    }
  })
  res.json(word)
});

app.get('/api/getCardsForWord', async(req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }

  const wordId = req.query.wordId as string;

  const cards = await prisma.card.findMany({
    where: {
      accountId: foundAccnt.id,
      wordId: wordId,
    },
    orderBy: {
      dateAdded: 'asc'
    }
  })

  res.json(cards)
})

app.post('/api/createCard', async(req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }
  const card = req.body.card;
  const cardType = req.body.cardType 

  // we have to link it to the account and the word the card is for
  // therefore, we use the 'connect' option
  const createdCard = await prisma.card.create({
    data: {
      cardData: card.cardData,
      dateAdded: card.dateAdded,
      knownLevel: card.knownLevel,
      cardType: cardType,
      lastReviewed: card.lastReviewed,
      timeDue: card.timeDue,
      account: {
        connect: {
          id: card.accountId
        }
      },
      word: {
        connect: {
          id: card.wordId
        }
      }
    }
  })
  return res.json(createdCard)
})

app.put('/api/updateCard', async(req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }

  const cardId = req.body.data.cardId;
  const newCard = req.body.data.newCard;

  // we have to link it to the account and the word the card is for
  // therefore, we use the 'connect' option
  const createdCard = await prisma.card.update({
    where: {
      id: cardId
    },
    data: {
      cardData: newCard.cardData,
      dateAdded: newCard.dateAdded,
      knownLevel: newCard.knownLevel,
      lastReviewed: newCard.lastReviewed,
      timeDue: newCard.timeDue,
      account: {
        connect: {
          id: newCard.accountId
        }
      },
      word: {
        connect: {
          id: newCard.wordId
        }
      }
    }
  })
  return res.json(createdCard)
})

app.delete('/api/deleteCard', async(req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }
  const cardId = req.query.cardId as string;
  const deletedCard = await prisma.card.delete({
    where: {
      id: cardId
    }
  })
  res.json(deletedCard)
})

// get all cards which are due (so, cur time > due time)
app.get('/api/getDueCards', async(req, res) => {
  const username = req.headers.username as string
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }
  const now_timestamp = Number(req.query.timestamp);
  const limit = Number(req.query.limit)
  // console.log(now_timestamp, limit);
  
  const dueCards = await prisma.card.findMany({
    where: {
      timeDue: {
        lt: (new Date(now_timestamp))
      }
    },
    take: limit
  })
  res.json(dueCards)
})

app.get('/api/searchDictionary', async(req, res) => {
  const username = req.headers.username as string;
  const password = req.headers.password as string;
  const foundAccnt = await loginAccount(username, password)
  if (!foundAccnt) {
    return res.status(403).json({error: 'invalid credentials'})
  }

  const queryStr = req.query.queryStr as string;
  if (!queryStr) {
    return res.status(403).json({error: 'no queryStr'})
  }
  const skip = Number(req.query.skip);
  const take = Number(req.query.take);

  const searchRes = await searchDictionary(queryStr, skip, take);
  // console.log(searchRes);
  
  res.json(searchRes)
})


const PORT = process.env.PORT || 3004
app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}`);  
})
