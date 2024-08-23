
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


export interface Login {
  username: string,
  password: string
}
