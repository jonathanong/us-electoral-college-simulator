// Validate apportionment-population.csv: Huntington-Hill on 435 seats must reproduce the Census
// "Number of Representatives" column for 1940, 1950 (48 states), 1960-2020. 1910/1930/1920 informational.
import { readCsv } from "./csv.ts";
import { loadCensus } from "./census.ts";
import { huntingtonHill } from "./hh.ts";

const D = new URL("../data/csv/", import.meta.url).pathname;
const ap = readCsv(D + "apportionment-population.csv");
const census = loadCensus();
let fails = 0;
for (const c of [1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020]) {
  const rows = ap.filter((r) => Number(r.census) === c && r.state !== "DC");
  const pops: Record<string, number> = {};
  for (const r of rows) {
    const reps = census.find((x) => x.census === c && x.st === r.state)?.reps;
    // exclude territories (no seats in the historical apportionment) from the check
    if (reps) pops[r.state] = Number(r.apportionment_population);
  }
  const seats = Object.keys(pops).reduce(
    (s, k) => s + (census.find((x) => x.census === c && x.st === k)!.reps as number),
    0,
  );
  const hh = huntingtonHill(pops, seats);
  const diff = Object.keys(pops).filter(
    (k) => hh[k] !== census.find((x) => x.census === c && x.st === k)!.reps,
  );
  const strict = [1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].includes(c);
  if (strict && diff.length) fails++;
  console.log(
    c,
    "seats",
    seats,
    "states",
    Object.keys(pops).length,
    "rows",
    rows.length,
    diff.length ? "DIFF " + diff.join(",") : "MATCH",
    strict ? "" : "(informational)",
  );
}
console.log("strict failures:", fails);
