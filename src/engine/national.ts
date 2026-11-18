import { leader } from "./allocate.ts";
import { majorityOf } from "./house.ts";
import type { Transfers } from "./rcv.ts";
import { BONUS_ELECTORS } from "./systems.ts";
import type { Election, Settings, Votes } from "./types.ts";

export const OTHER = "other";

export function sumVotes(rows: Iterable<Votes>): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const row of rows) {
    for (const [id, n] of Object.entries(row)) totals[id] = (totals[id] ?? 0) + n;
  }
  return totals;
}

/** National popular vote by candidate, summed over the states. */
export function nationalPopular(election: Election): Record<string, number> {
  return sumVotes([...election.states.values()].map((s) => s.popular));
}

/** The two national popular-vote leaders (unlisted "other" votes excluded). */
export function frontRunners(popular: Votes): [string, string] {
  const [first = "", second = ""] = Object.entries(popular)
    .filter(([id]) => id !== OTHER)
    .toSorted((a, b) => b[1] - a[1])
    .map(([id]) => id);
  return [first, second];
}

/** Ranked-choice transfer assumptions for one election, from `${year}.${id}` percentages. */
export function transfersFor(year: number, popular: Votes, settings: Settings): Transfers {
  const [first, second] = frontRunners(popular);
  const toFirst: Record<string, number> = {};
  for (const [key, pct] of Object.entries(settings.transfers)) {
    const [y, id] = key.split(".");
    if (Number(y) === year && id) toFirst[id] = pct / 100;
  }
  return { first, second, toFirst };
}

/** Bonus electors (National Bonus Plan) for the national popular-vote winner. */
export function bonusFor(settings: Settings, popular: Votes): Votes {
  if (settings.system !== "bonus" || Object.keys(popular).length === 0) return {};
  return { [leader(popular)]: BONUS_ELECTORS };
}

/** Electoral votes needed to win, and the winner (null when nobody wins outright). */
export function decide(
  settings: Settings,
  totals: Votes,
  totalElectoralVotes: number,
  popular: Votes,
): { majority: number; winner: string | null } {
  if (settings.system === "national" && Object.keys(popular).length > 0) {
    return { majority: majorityOf(totalElectoralVotes), winner: leader(popular) };
  }
  const majority = majorityOf(totalElectoralVotes);
  const top = leader(totals);
  // Lodge–Gossett: the most electoral votes wins; an exact tie goes to the popular-vote leader.
  // Compare whole thousandths, since summed fractions pick up floating-point error.
  if (settings.system === "fractional") {
    const thousandths = (id: string) => Math.round(totals[id]! * 1000);
    const tied = Object.keys(totals).filter((id) => thousandths(id) === thousandths(top));
    const byPopular = Object.fromEntries(tied.map((id) => [id, popular[id] ?? 0]));
    return { majority, winner: (tied.length > 1 ? leader(byPopular) : top) || null };
  }
  return { majority, winner: (totals[top] ?? 0) >= majority ? top : null };
}
