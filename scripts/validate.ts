// Validate the final CSVs: elector counts, national EV totals, plurality vs EV winners, ME/NE.
import { readCsv } from "./csv.ts";
import { loadCensus, censusFor } from "./census.ts";

const D = new URL("../data/csv/", import.meta.url).pathname;
const ev = readCsv(D + "electoral-votes.csv");
const pv = readCsv(D + "popular-votes.csv");
const dist = readCsv(D + "me-ne-districts.csv");
const census = loadCensus();
const OFFICIAL: Record<number, Record<string, number>> = {
  1912: { wilson: 435, roosevelt: 88, taft: 8 },
  1916: { wilson: 277, hughes: 254 },
  1920: { harding: 404, cox: 127 },
  1924: { coolidge: 382, davis: 136, lafollette: 13 },
  1928: { hoover: 444, smith: 87 },
  1932: { roosevelt: 472, hoover: 59 },
  1936: { roosevelt: 523, landon: 8 },
  1940: { roosevelt: 449, willkie: 82 },
  1944: { roosevelt: 432, dewey: 99 },
  1948: { truman: 303, dewey: 189, thurmond: 39 },
  1952: { eisenhower: 442, stevenson: 89 },
  1956: { eisenhower: 457, stevenson: 73, jones: 1 },
  1960: { kennedy: 303, nixon: 219, byrd: 15 },
  1964: { johnson: 486, goldwater: 52 },
  1968: { nixon: 301, humphrey: 191, wallace: 46 },
  1972: { nixon: 520, mcgovern: 17, hospers: 1 },
  1976: { carter: 297, ford: 240, reagan: 1 },
  1980: { reagan: 489, carter: 49 },
  1984: { reagan: 525, mondale: 13 },
  1988: { bush: 426, dukakis: 111, bentsen: 1 },
  1992: { clinton: 370, bush: 168 },
  1996: { clinton: 379, dole: 159 },
  2000: { bush: 271, gore: 266, abstain: 1 },
  2004: { bush: 286, kerry: 251, edwards: 1 },
  2008: { obama: 365, mccain: 173 },
  2012: { obama: 332, romney: 206 },
  2016: { trump: 304, clinton: 227, powell: 3, kasich: 1, paul: 1, spottedeagle: 1, sanders: 1 },
  2020: { biden: 306, trump: 232 },
  2024: { trump: 312, harris: 226 },
};
let problems = 0;
const bad = (m: string) => (problems++, console.log("PROBLEM", m));
const key = (...a: (string | number)[]) => a.join("|");
const stEv = new Map<string, number>();
const natEv = new Map<string, number>();
const evBy = new Map<string, Map<string, number>>();
for (const r of ev) {
  const n = Number(r.electoral_votes);
  stEv.set(key(r.year, r.state), (stEv.get(key(r.year, r.state)) ?? 0) + n);
  natEv.set(key(r.year, r.candidate), (natEv.get(key(r.year, r.candidate)) ?? 0) + n);
  const m = evBy.get(key(r.year, r.state)) ?? new Map();
  m.set(r.candidate, n);
  evBy.set(key(r.year, r.state), m);
}
for (const year of Object.keys(OFFICIAL).map(Number)) {
  const c = censusFor(year);
  let total = 0;
  const states = new Set(ev.filter((r) => Number(r.year) === year).map((r) => r.state));
  for (const st of states) {
    const row = census.find((x) => x.census === c && x.st === st);
    let exp = row?.reps ? row.reps + 2 : 3;
    if (st === "DC") exp = 3;
    const got = stEv.get(key(year, st));
    if (got !== exp) bad(`${year} ${st} electors ${got} != ${exp}`);
    total += got ?? 0;
  }
  const want = year < 1960 ? 531 : year === 1960 ? 537 : 538;
  if (total !== want) bad(`${year} total ${total} != ${want}`);
  const nat: Record<string, number> = {};
  for (const [k, v] of natEv) if (k.startsWith(year + "|")) nat[k.split("|")[1]] = v;
  const o = OFFICIAL[year];
  for (const id of new Set([...Object.keys(o), ...Object.keys(nat)]))
    if ((nat[id] ?? 0) !== (o[id] ?? 0)) bad(`${year} ${id} EV ${nat[id]} != ${o[id]}`);
  console.log(year, "total", total, "states", states.size, JSON.stringify(nat));
}
// plurality vs EV winner
const pvBy = new Map<string, Map<string, number>>();
for (const r of pv) {
  const k = key(r.year, r.state);
  const m = pvBy.get(k) ?? new Map();
  m.set(r.candidate, Number(r.votes));
  pvBy.set(k, m);
}
for (const [k, m] of pvBy) {
  const top = [...m].sort((a, b) => b[1] - a[1])[0][0];
  const e = evBy.get(k)!;
  const evTop = [...e].sort((a, b) => b[1] - a[1])[0];
  if (top !== evTop[0] || e.size > 1) {
    console.log("PLURALITY/EV note", k, "pv top", top, "EV", JSON.stringify([...e]));
  }
}
// ME/NE: district winners consistent with EV rows
for (const [year, st] of new Set(dist.map((r) => key(r.year, r.state)))
  .entries()
  .map(([, v]) => v.split("|")) as Iterable<string[]>) {
  const ws = dist.filter((r) => r.year === year && r.state === st).map((r) => r.winner);
  const e = evBy.get(key(year, st))!;
  const want = new Map<string, number>();
  for (const w of ws) want.set(w, (want.get(w) ?? 0) + 1);
  const at = [...e].reduce((a, b) => ((want.get(a[0]) ?? 0) > 0 || a[1] >= b[1] ? a : b));
  void at;
  for (const [c, n] of e)
    if (n < (want.get(c) ?? 0)) bad(`${year} ${st} district wins ${c} exceed EV`);
  const sum = [...e.values()].reduce((s, v) => s + v, 0);
  if (sum !== ws.length + 2) bad(`${year} ${st} EV ${sum} != ${ws.length + 2}`);
}
console.log("problems:", problems);
if (problems) process.exitCode = 1;
