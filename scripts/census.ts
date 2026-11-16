// Load Census apportionment table (reps and resident pop) keyed by census year and USPS code.
import { readCsv } from "./csv.ts";
import { STATES } from "./states.ts";

const FILE = new URL("../data/csv/census-apportionment.csv", import.meta.url).pathname;

export interface CensusRow {
  census: number;
  st: string;
  resident: number;
  reps: number | null;
}

export function loadCensus(): CensusRow[] {
  const out: CensusRow[] = [];
  for (const r of readCsv(FILE)) {
    const st = STATES[r.Name];
    if (!st) continue;
    const n = (s: string) => (s === "" ? null : Number(s.replace(/,/g, "")));
    out.push({
      census: Number(r.Year),
      st,
      resident: n(r["Resident Population"]) as number,
      reps: n(r["Number of Representatives"]),
    });
  }
  return out;
}

/** Census whose apportionment governed the presidential election of `year`. */
export function censusFor(year: number): number {
  if (year <= 1930) return 1910;
  return Math.floor((year - 2) / 10) * 10;
}
