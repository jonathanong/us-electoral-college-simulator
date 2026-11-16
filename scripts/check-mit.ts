// Compare popular-votes.csv (Wikipedia-derived) with MIT EDSL for 1976-2024.
import { readCsv } from "./csv.ts";
import { loadMit } from "./mit.ts";

const D = new URL("../data/csv/", import.meta.url).pathname;
const mit = loadMit();
let n = 0;
let same = 0;
for (const r of readCsv(D + "popular-votes.csv")) {
  const year = Number(r.year);
  if (year < 1976) continue;
  const m = mit[year]?.[r.state]?.votes[r.candidate] ?? 0;
  const w = Number(r.votes);
  if (m === w) same++;
  else {
    n++;
    console.log(year, r.state, r.candidate, "wiki", w, "mit", m, "diff", w - m);
  }
}
console.log("same", same, "different", n);
