import { PrismaClient } from "@prisma/client";
import axios, { AxiosResponse } from 'axios'
import { addCustomSentenceForWord, addWordsToDeck, changeWordKnownLevel, createDeck, deleteCustomSentenceForWord, deleteWordFromDeck, getCard, getCardsForWord, getCustomSentencesForWord, getDeckInfo, getDueCards, getExampleSentencesForWord, getNewWordsList, getTDeckListForUser, getWord, getWordKnownLevel, getWordsInDeck, register, searchDictionary, setBaseUrl, wordIdsToWords  } from '../../frontend/src/service/requestHelper'
import { log } from "console";

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
  await prisma.customSentence.deleteMany();
  await prisma.account.deleteMany(); 
  
  await register('a', 'b')
}

/**
 * - create a user
 * - mark 3 words as known
 * - check that the known words statistics has updated
 */
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
  const words = await getWordsInDeck('a', 'b', deck.id, 0, 1000)
  if ('error' in words) {
    console.log(words)
    return;
  }
  
  const wordIds = [words[0].id, words[1].id, words[2].id]
  for (let wordId of wordIds) {
    await changeWordKnownLevel('a', 'b', wordId, 1);
  }
  decks = await getTDeckListForUser('a', 'b');
  if ('error' in decks) {
    console.log(words);
    return;
  }
  console.log('final decks');
  console.log(decks);
  // await reset();
}

async function getWordKnownLevel_afterSet() {
  await reset();
  let decks = await getTDeckListForUser('a', 'b');
  if ('error' in decks) {
    console.log('failed');
    return;
  }
  const deck = decks[0];
  console.log('initial decks');
  console.log(deck);
  const words = await getWordsInDeck('a', 'b', deck.id, 0, 1000)
  if ('error' in words) {
    console.log(words)
    return;
  }
  await changeWordKnownLevel('a', 'b', words[0].id, 1);

  const k0 = await getWordKnownLevel('a', 'b', words[0].id)
  console.log(k0);
  const k4 = await getWordKnownLevel('a', 'b', words[1].id)
  console.log(k4);
}

async function getExampleSentencesForWord_1() {
  await reset();
  let decks = await getTDeckListForUser('a', 'b');
  if ('error' in decks) {
    console.log('failed');
    return;
  }
  const deck = decks[0];
  console.log('initial decks');
  console.log(deck);
  const words = await getWordsInDeck('a', 'b', deck.id, 0, 1000)
  if ('error' in words) {
    console.log(words)
    return;
  }
  const word = words[10]
  console.log(word.kanji);
  const sentences = await getExampleSentencesForWord('a', 'b', word.id)
  console.log(sentences);
}

async function getCardsForWord_1() {
  await reset();
  let decks = await getTDeckListForUser('a', 'b');
  if ('error' in decks) {
    console.log('failed');
    return;
  }
  const deck = decks[0];
  console.log('initial decks');
  console.log(deck);
  const words = await getWordsInDeck('a', 'b', deck.id, 0, 1000)
  if ('error' in words) {
    console.log(words)
    return;
  }
  const word = words[10]
  console.log(word.kanji);
  const cards = await getCardsForWord('a', 'b', word.id)
  console.log(cards);
  
}

async function getNewWordsList_1() {
  await reset();
  let decks = await getTDeckListForUser('a', 'b');
  if ('error' in decks) {
    console.log('failed');
    return;
  }
  const deck = decks[0];
  console.log('initial deck');
  console.log(deck);
  const words = await getWordsInDeck('a', 'b', deck.id, 0, 1000)
  if ('error' in words) {
    console.log(words)
    return;
  }
  console.log('first 5 words in deck');
  for (let i = 0; i < 5; i++) {
    console.log(' ' + words[i].kanji);
  }
  let newWords = await getNewWordsList('a', 'b', 'HIGHEST PRIO', 0);
  console.log('first time');
  console.log(newWords);
  console.log('after cache');
  newWords = await getNewWordsList('a', 'b', 'HIGHEST PRIO', 15 * 3600 * 1000);
  console.log(newWords);
  console.log('database entry');
  const acntId = (await prisma.account.findFirst({
    where: {
      username: 'a'
    }
  }))?.id

  const entry = await prisma.newWordList.findUnique({
    where: {
      accountId: acntId
    }
  })
  console.log(entry);
}

async function getWordsInDeck_1() {
  // await reset();
  setBaseUrl('http://localhost:3004')
  let decks = await getTDeckListForUser('a', 'b');
  if ('error' in decks) {
    console.log(decks);
    return;
  }
  const deck = decks[0];
  console.log('initial deck');
  console.log(deck);
  let words = await getWordsInDeck('a', 'b', deck.id, 0, 1000)
  if ('error' in words) {
    console.log(words)
    return;
  }
  console.log('first 5 words in deck');
  // make first 5 words known
  for (let i = 0; i < 5; i++) {
    console.log(words[i].kanji);
    await changeWordKnownLevel('a', 'b', words[i].id, 0);
  }

  words = await getWordsInDeck('a', 'b', deck.id, 0, 1000)
  if ('error' in words) {
    console.log(words)
    return;
  }
  for (let i = 0; i < 10; i++) {
    console.log(JSON.stringify(words[i], null, 4));
  }
}

async function getDeckInfo_1() {
  await reset();
  let decks = await getTDeckListForUser('a', 'b');
  if ('error' in decks) {
    console.log('failed');
    return;
  }
  const deck = decks[0];
  console.log('initial deck');
  console.log(deck);
  const deckId = deck.id;
  const deckInfo = await getDeckInfo('a', 'b', deckId);
  console.log(deckInfo);
}

async function deleteWordFromDeck_1() {
  await reset();
  let decks = await getTDeckListForUser('a', 'b');
  if ('error' in decks) {
    console.log('failed');
    return;
  }
  const deck = decks[0];
  let words = await getWordsInDeck('a', 'b', deck.id, 0, 1000)
  if ('error' in words) {
    console.log('failed');
    return;
  }
  console.log('first 5 words in deck');
  for (let i = 0; i < 5; i++) {
    console.log(words[i]);
  }
  console.log('delete words[3]');
  await deleteWordFromDeck('a','b', deck.id, words[3].id)

  console.log('refetch words');
  words = await getWordsInDeck('a', 'b', deck.id, 0, 1000)
  if ('error' in words) {
    console.log('failed');
    return;
  }
  console.log('new words');
  for (let i = 0; i < 5; i++) {
    console.log(words[i]); 
  }
}

async function searchDictionary_1() {
  await reset();
  const result = await searchDictionary('a', 'b', 'gozen', 0, 10);
  console.log(result);
}

async function customSentence_1() {
  await reset();
  
  const searchResult = await searchDictionary('a', 'b', 'safety', 0, 10);
  if ('error' in searchResult) {
    console.log('failed');
    return;
  }
  console.log(searchResult);
  const word = searchResult[0].word
  await addCustomSentenceForWord('a', 'b', word.id, '安全は一番大切だ', 'safety is most important', '安全')
  let sentences = await getCustomSentencesForWord('a', 'b', word.id);
  console.log(sentences);
  if ('error' in sentences) {
    console.log('failed');
    return;
  }
  await deleteCustomSentenceForWord('a', 'b', sentences[0].id);
  console.log('here');
  sentences = await getCustomSentencesForWord('a', 'b', word.id);
  console.log(sentences);
}

async function createDeck_1() {
  await reset();
  console.log('here1');
  await createDeck('a', 'b', 'created-1', []);
  const res = await getTDeckListForUser('a', 'b');
  if ('error' in res) {
    console.log('failed');
    return;
  }
  console.log(res);
}

async function wordIdsToWords_1() {
  await reset();
  let newWords = await getNewWordsList('a', 'b', 'HIGHEST PRIO', 0);
  if ('error' in newWords) {
    console.log('failed');
    return;
  }
  let newWordIds = newWords.map(w => w.id);
  const res = await wordIdsToWords('a', 'b', newWordIds)
  console.log(res);
}

async function addWordsToDeck_1() {
  await reset();
  const deckInfos = await getTDeckListForUser('a', 'b');
  if ('error' in deckInfos) {
    console.log('failed');
    return;
  }
  const deck = deckInfos[0];
  console.log(deck);
  const searchResults = await searchDictionary('a', 'b', 'go', 0, 10);
  if ('error' in searchResults) {
    console.log('failed');
    return;
  }
  console.log(searchResults);
  const wordIds = searchResults.map(sr => sr.word.id)
  console.log(wordIds.length);
  console.log(wordIds);
  const ret = await addWordsToDeck('a', 'b', deck.id, wordIds);
  console.log(ret);
}

async function deleteAllCards() {
  await prisma.card.deleteMany()
}

async function main() {
  await reset()
}

main()