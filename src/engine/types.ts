/** Two-letter USPS code, including "DC". */
export type StateCode = string;

export type Method = "huntington-hill" | "webster" | "jefferson" | "hamilton";

export type HouseRule =
  | { kind: "historical" }
  | { kind: "fixed"; size: number }
  | { kind: "cube-root" }
  | { kind: "wyoming" }
  | { kind: "ratio"; perRep: number }
  | { kind: "custom"; sizes: Readonly<Record<number, number>> };

/** "electors": scale each state's pledged elector split. "popular": statewide plurality takes all. */
export type Allocation = "electors" | "popular";

export interface Settings {
  rule: HouseRule;
  method: Method;
  allocation: Allocation;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
}

export type Votes = Readonly<Record<string, number>>;

export interface StateResult {
  state: StateCode;
  /** Electoral votes actually cast (faithless votes and abstentions included). */
  actual: Votes;
  /** Electoral votes as pledged (faithless electors returned to their pledged candidate). */
  pledged: Votes;
  /** Popular votes by candidate; empty when unknown. */
  popular: Votes;
  /** Maine/Nebraska congressional-district method in force. */
  districted: boolean;
}

export interface Election {
  year: number;
  candidates: readonly Candidate[];
  states: ReadonlyMap<StateCode, StateResult>;
}

export interface Dataset {
  elections: ReadonlyMap<number, Election>;
  /** census year -> state -> apportionment population (DC included as resident population). */
  populations: ReadonlyMap<number, ReadonlyMap<StateCode, number>>;
  /** census year -> state -> House seats actually apportioned. */
  historicalSeats: ReadonlyMap<number, ReadonlyMap<StateCode, number>>;
}

export interface StateOutcome {
  state: StateCode;
  seats: number;
  electoralVotes: number;
  actualElectoralVotes: number;
  allocation: Votes;
  winner: string;
}

export interface Simulation {
  year: number;
  census: number;
  houseSize: number;
  states: StateOutcome[];
  totals: Votes;
  totalElectoralVotes: number;
  majority: number;
  /** null when nobody reaches a majority (contingent election in the House). */
  winner: string | null;
  actualWinner: string | null;
}
