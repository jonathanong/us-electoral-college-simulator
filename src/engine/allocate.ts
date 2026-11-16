import type { Allocation, StateResult, Votes } from "./types.ts";

/** Candidate with the most votes; ties go to the alphabetically first id. */
export function leader(votes: Votes): string {
  let best = "";
  let bestVotes = -Infinity;
  for (const [id, n] of Object.entries(votes)) {
    if (n > bestVotes || (n === bestVotes && id < best)) {
      best = id;
      bestVotes = n;
    }
  }
  return best;
}

/** Split `total` seats in proportion to `weights` by largest remainder. */
export function largestRemainder(weights: Votes, total: number): Record<string, number> {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const sum = entries.reduce((a, [, w]) => a + w, 0);
  const rows = entries.map(([id, w]) => {
    const quota = (w * total) / sum;
    return { id, w, seats: Math.floor(quota), rem: quota - Math.floor(quota) };
  });
  let left = total - rows.reduce((a, r) => a + r.seats, 0);
  rows.sort((a, b) => b.rem - a.rem || b.w - a.w || (a.id < b.id ? -1 : 1));
  for (const row of rows) {
    if (left === 0) break;
    row.seats++;
    left--;
  }
  return Object.fromEntries(rows.filter((r) => r.seats > 0).map((r) => [r.id, r.seats]));
}

/**
 * Award a state's electoral votes under a (possibly counterfactual) total.
 *
 * - Districted states (Maine, Nebraska): two at-large votes to the statewide winner; district votes
 *   scaled from the historical district split (an estimate, since real districts would be redrawn).
 * - "popular": statewide plurality winner takes all.
 * - "electors": the pledged elector split scaled to the new total (all-or-nothing in most states;
 *   proportional where electors were historically split, e.g. California 1912).
 */
export function allocate(result: StateResult, electoralVotes: number, mode: Allocation): Votes {
  const hasPopular = Object.keys(result.popular).length > 0;
  const usePopular = mode === "popular" && hasPopular;
  const winner = usePopular ? leader(result.popular) : leader(result.pledged);
  if (result.districted) {
    const districts: Record<string, number> = { ...result.pledged };
    const statewide = leader(result.pledged);
    districts[statewide] = districts[statewide]! - 2;
    const split = largestRemainder(districts, electoralVotes - 2);
    return { ...split, [winner]: (split[winner] ?? 0) + 2 };
  }
  if (usePopular) return { [winner]: electoralVotes };
  return largestRemainder(result.pledged, electoralVotes);
}
