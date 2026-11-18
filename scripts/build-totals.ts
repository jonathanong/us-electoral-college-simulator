// Build data/csv/state-totals.csv: total presidential votes cast per state (all candidates, including
// those under the 1% roster threshold), from the "State total" column of the cached Wikipedia tables.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cacheDir } from "./fetch.ts";
import { readCsv, toCsv } from "./csv.ts";
import type { Area } from "./build-raw.ts";

const OUT = new URL("../data/csv/", import.meta.url).pathname;
const raw = JSON.parse(readFileSync(join(cacheDir, "raw.json"), "utf8")) as Record<
  string,
  Record<string, Area>
>;
const listed: Record<string, number> = {};
for (const r of readCsv(OUT + "popular-votes.csv")) {
  const k = `${r.year},${r.state}`;
  listed[k] = (listed[k] ?? 0) + Number(r.votes);
}
const rows: (string | number)[][] = [];
for (const year of Object.keys(raw).sort()) {
  for (const st of Object.keys(raw[year]).sort()) {
    const total = raw[year][st].total ?? 0;
    const sum = listed[`${year},${st}`] ?? 0;
    // Listed votes can exceed the Wikipedia total where MIT EDSL values were swapped in.
    rows.push([year, st, Math.max(total, sum)]);
  }
}
writeFileSync(OUT + "state-totals.csv", toCsv(["year", "state", "total_votes"], rows));
console.log("rows", rows.length);
