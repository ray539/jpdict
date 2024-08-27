import { PrismaClient } from "@prisma/client";
import axios, { AxiosResponse } from 'axios'
import { changeWordKnownLevel, getTDeckListForUser, getWordsInDeck, register, setBaseUrl  } from '../../frontend/src/service/requestHelper'
const prisma = new PrismaClient();
// const BASEURL = 'http://localhost:3004'




async function reset() {
  // delete everything except for 'words' and 'examplesentence'
  // make an account with username a, password b
  setBaseUrl('http://localhost:3004')
  await prisma.card.deleteMany();
  await prisma.belongsToWordDeck.deleteMany();
  await prisma.wordDeck.deleteMany();
  await prisma.newWordList.deleteMany();
  await prisma.wordKnownLevel.deleteMany();
  await prisma.similarWord.deleteMany();
  await prisma.account.deleteMany();  
  await register('a', 'b')
}

async function getTDeckListForUser_afterKnownWordChange() {
  await reset();
  let decks = await getTDeckListForUser('a', 'b');
  if ('error' in decks) {
    console.log('failed');
    return;
  }
  
  const deck = decks[0];
  console.log('initial decks');
  console.log(deck);
  const words = await getWordsInDeck('a', 'b', deck.id)
  if ('error' in words) {
    console.log(words)
    return;
  }
  
  const wordIds = [words[0].id, words[1].id, words[2].id]
  for (let wordId of wordIds) {
    await changeWordKnownLevel('a', 'b', wordId, '1');
  }
  decks = await getTDeckListForUser('a', 'b');
  if ('error' in decks) {
    console.log(words);
    return;
  }
  console.log('final decks');
  console.log(decks);
  await reset();
}

async function getNewWordsList_1() {
  await reset();
  
}


async function main() {
  getTDeckListForUser_afterKnownWordChange()
}

main()




