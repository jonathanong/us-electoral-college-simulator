// Cross-check national popular-vote sums in popular-votes.csv against the page infobox / ticket box.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { cacheDir } from "./fetch.ts";
import { readCsv } from "./csv.ts";
import { CANDS } from "./candidates.ts";

const D = new URL("../data/csv/", import.meta.url).pathname;
const pv = readCsv(D + "popular-votes.csv");
const sums = new Map<string, number>();
for (const r of pv)
  sums.set(
    `${r.year}|${r.candidate}`,
    (sums.get(`${r.year}|${r.candidate}`) ?? 0) + Number(r.votes),
  );
for (let year = 1912; year <= 2024; year += 4) {
  const f = join(cacheDir, `${year}_United_States_presidential_election.txt`);
  if (!existsSync(f)) continue;
  const txt = readFileSync(f, "utf8");
  const boxes = [...txt.matchAll(/ticket box row\|([^\n]*)/g)].map((m) => m[1]);
  const lines: string[] = [];
  for (const c of CANDS.filter((c) => c.year === year && c.m)) {
    const sur = c.name.split(" ").pop()!;
    const b = boxes.find((x) => /name\s*=/.test(x) && x.split("pv")[0].includes(sur));
    const m = b && /pv\s*=\s*([\d,]+)/.exec(b);
    const off = m ? Number(m[1].replace(/,/g, "")) : null;
    const mine = sums.get(`${year}|${c.id}`);
    lines.push(
      `${c.id}:${mine}${off === null ? "(no ref)" : mine === off ? " ok" : ` != ${off} (${(mine ?? 0) - off})`}`,
    );
  }
  console.log(year, lines.join("  "));
}
