// NOTE: frontend may not build with this
// but we'll see....
export enum DeckSelectionStrat {
  HIGHESTPRIO,
  RANDOM
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
  seqNum: number
  entrySeq: string
  kanji: string
  kanjiOther: [string]
  reading: string
  readingOther: [string]
  definitions: [Definition]
}