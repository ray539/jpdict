// NOTE: frontend may not build with this
// but we'll see....
export enum DeckSelectionStrat {
  HIGHESTPRIO,
  RANDOM
}

export enum CardType {
  VOCAB,
  SENTENCE
}

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
  knownLevel: number
}

export interface ExampleSentence {
  id: string;
  jpn: string;
  eng: string;
  default_word_wordForm: string;
  default_wordId: string;
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
  knownLevel: number;
  cardType: CardType;
  lastReviewed: Date | null;
  timeDue: Date
  dateAdded: Date;
}

export interface SearchResult {
  word: Word,
  matchLvl: number
}

export function knownLevelToColorDescription(knownLevel: number | null) {
  let kanjiColor = 'black';
  let def = '';
  if (knownLevel != null) {
    if (knownLevel == 0) {
      kanjiColor = 'blue'
      def = '(known level 0, new)'
    } else {
      kanjiColor = 'forestgreen'
      def = `(known level ${knownLevel}})`
    }
  }
  return {kanjiColor: kanjiColor, def: def}
}