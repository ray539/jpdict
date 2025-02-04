// NOTE: frontend may not build with this
// but we'll see....
export enum DeckSelectionStrat {
  HIGHESTPRIO,
  RANDOM
}

// export enum CardType {
//   VOCAB,
//   SENTENCE
// }
export type CardType = 'VOCAB' | 'SENTENCE'

export interface Account {
  id: string;
  username: string;
  password: string;
  TDeckSelectionStrat: DeckSelectionStrat;
}

export interface TDeckInfo {
  id: string
  name: string,
  totalWords: number,
  knownWords: number
}

export interface Login {
  username: string,
  password: string
}

export interface Definition {
  positions: [string]
  extraInfo: [string]
  glosses: [string]
  antonyms: [string]
  xrefs: [string]
}

export interface Word {
  id: string
  seqNum?: number
  entrySeq: string
  kanji: string
  kanjiOther: [string]
  reading: string
  readingOther: [string]
  definitions: [Definition]
  knownLevel?: number // undefined - word not seen before
}


export interface ExampleSentence {
  id: string;
  jpn: string;
  eng: string;
  default_word_wordForm: string;
  default_wordId: string;
  custom: boolean;
}

export interface CardData {
  entrySeq: string
  kanji: string
  kanjiOther: string
  reading: string
  readingOther: string
  definitions: string
  exampleSentences: ExampleSentence[]
}

export interface Card {
  id: string;
  accountId: string;
  wordId: string;
  cardData: CardData;
  easeFactor: number,
  knownLevel: number; // has to be defined
  cardType: CardType;
  name: string,
  lastReviewed: Date | null;
  timeDue: Date
  dateAdded: Date;
}

export interface CardUpdateQuery {
  cardData?: CardData
  dateAdded?: Date
  knownLevel?: number
  easeFactor?: number
  lastReviewed?: Date
  timeDue?: Date
}

export interface SearchResult {
  word: Word,
  matchLvl: number
}

export function knownLevelToColorDescription(knownLevel: number | undefined) {
  let kanjiColor = 'black';
  let def = '';
  if (knownLevel != undefined) {
    if (knownLevel == 0) {
      kanjiColor = 'blue'
      def = '(known level 0, seen)'
    } else {
      kanjiColor = 'forestgreen'
      def = `(known level ${knownLevel})`
    }
  }
  return {kanjiColor: kanjiColor, def: def}
}

export function checkSentenceInput(jpn_input: string, word: Word) {
  if (!jpn_input) {
    return {error: 'jpn input is empty'};
  }
  
  const wordsToMatch = [word.kanji].concat(word.kanjiOther);
  // see if 'jpn_input' contains the word
  const foundWordForm = wordsToMatch.find(w => jpn_input.includes(w))
  if (!foundWordForm) {
    return  {error: `word "${wordsToMatch}" not in sentence`}
  }
  return {foundWordForm: foundWordForm}
}

export function getRandomIntInclusive(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // The maximum is inclusive and the minimum is inclusive
}