import type { Candidate, Dataset, Election, StateResult } from "../engine/types.ts";
import { parseCsv, toInt } from "./csv.ts";
import { CODE_BY_NAME } from "./states.ts";

export interface RawFiles {
  censusApportionment: string;
  apportionmentPopulation: string;
  candidates: string;
  electoralVotes: string;
  faithless: string;
  popularVotes: string;
}

/** Seats granted on admission between censuses: AZ/NM (1912) and AK/HI (1959). */
const ADMISSION_SEATS: Readonly<Record<number, Readonly<Record<string, number>>>> = {
  1910: { AZ: 1, NM: 1 },
  1950: { AK: 1, HI: 1 },
};

/** First election each state used the congressional-district method. */
const DISTRICTED_SINCE: Readonly<Record<string, number>> = { ME: 1972, NE: 1992 };

type Tally = Record<string, number>;
type Nested<T> = Map<number, Map<string, T>>;

function nested<T>(map: Nested<T>, year: number, key: string, init: () => T): T {
  let inner = map.get(year);
  if (!inner) map.set(year, (inner = new Map()));
  let value = inner.get(key);
  if (value === undefined) inner.set(key, (value = init()));
  return value;
}

function loadCensus(files: RawFiles): Pick<Dataset, "populations" | "historicalSeats"> {
  const populations: Nested<number> = new Map();
  const historicalSeats: Nested<number> = new Map();
  for (const row of parseCsv(files.censusApportionment)) {
    const code = CODE_BY_NAME.get(row["Name"]!);
    if (!code || row["Geography Type"] !== "State") continue;
    const year = toInt(row["Year"])!;
    populations.set(year, populations.get(year) ?? new Map());
    populations.get(year)!.set(code, toInt(row["Resident Population"])!);
    const seats = toInt(row["Number of Representatives"]) ?? ADMISSION_SEATS[year]?.[code];
    if (seats !== undefined) nested(historicalSeats, year, code, () => seats);
  }
  for (const row of parseCsv(files.apportionmentPopulation)) {
    const year = toInt(row["census"])!;
    populations.get(year)!.set(row["state"]!, toInt(row["apportionment_population"])!);
  }
  return { populations, historicalSeats };
}

function loadVotes(text: string, column: string): Nested<Tally> {
  const out: Nested<Tally> = new Map();
  for (const row of parseCsv(text)) {
    const n = toInt(row[column]) ?? 0;
    if (n <= 0) continue;
    const tally = nested(out, toInt(row["year"])!, row["state"]!, () => ({}) as Tally);
    tally[row["candidate"]!] = (tally[row["candidate"]!] ?? 0) + n;
  }
  return out;
}

function pledgedFrom(actual: Tally, faithless: Record<string, string>[]): Tally {
  const pledged = { ...actual };
  for (const row of faithless) {
    const n = toInt(row["count"])!;
    pledged[row["cast_for"]!] = pledged[row["cast_for"]!]! - n;
    pledged[row["pledged_to"]!] = (pledged[row["pledged_to"]!] ?? 0) + n;
  }
  return Object.fromEntries(Object.entries(pledged).filter(([, n]) => n > 0));
}

export function buildDataset(files: RawFiles): Dataset {
  const { populations, historicalSeats } = loadCensus(files);
  const candidates = new Map<number, Candidate[]>();
  for (const row of parseCsv(files.candidates)) {
    const year = toInt(row["year"])!;
    const list = candidates.get(year) ?? [];
    list.push({ id: row["candidate"]!, name: row["name"]!, party: row["party"]! });
    candidates.set(year, list);
  }
  const electoral = loadVotes(files.electoralVotes, "electoral_votes");
  const popular = loadVotes(files.popularVotes, "votes");
  const faithless = parseCsv(files.faithless);
  const elections = new Map<number, Election>();
  for (const [year, byState] of [...electoral].toSorted((a, b) => a[0] - b[0])) {
    const states = new Map<string, StateResult>();
    for (const [state, actual] of [...byState].toSorted((a, b) => (a[0] < b[0] ? -1 : 1))) {
      const rows = faithless.filter((r) => toInt(r["year"]) === year && r["state"] === state);
      states.set(state, {
        state,
        actual,
        pledged: pledgedFrom(actual, rows),
        popular: popular.get(year)?.get(state) ?? {},
        districted: year >= (DISTRICTED_SINCE[state] ?? Infinity),
      });
    }
    elections.set(year, { year, candidates: candidates.get(year) ?? [], states });
  }
  return { elections, populations, historicalSeats };
}
