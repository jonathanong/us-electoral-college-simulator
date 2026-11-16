// MIT Election Data + Science Lab "U.S. President 1976-2024" state returns (CC0).
// doi:10.7910/DVN/42MVDX, file 1976-2024-president.csv, cached as $TMPDIR/edata/mit-president.csv
import { join } from "node:path";
import { cacheDir } from "./fetch.ts";
import { readCsv } from "./csv.ts";
import { CANDS } from "./candidates.ts";

export interface MitState {
  votes: Record<string, number>;
  /** sum of every ballot line in the state, vs the file's own totalvotes column */
  sumAll: number;
  total: number;
}

/** votes summed over every ballot line (fusion lines, write-ins included) for roster candidates. */
export function loadMit(): Record<number, Record<string, MitState>> {
  const out: Record<number, Record<string, MitState>> = {};
  for (const r of readCsv(join(cacheDir, "mit-president.csv"))) {
    const year = Number(r.year);
    const y = (out[year] ??= {});
    const s = (y[r.state_po] ??= { votes: {}, sumAll: 0, total: Number(r.totalvotes) });
    s.sumAll += Number(r.candidatevotes);
    const last = r.candidate.split(",")[0].trim().toUpperCase();
    const c = CANDS.find(
      (x) => x.year === year && x.m && x.name.split(" ").pop()!.toUpperCase() === last,
    );
    if (c) s.votes[c.id] = (s.votes[c.id] ?? 0) + Number(r.candidatevotes);
  }
  return out;
}
