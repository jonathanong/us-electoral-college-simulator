import { allocate, largestRemainder, leader } from "./allocate.ts";
import { instantRunoff, type Transfers } from "./rcv.ts";
import type { Settings, StateResult, Votes } from "./types.ts";

/** Bonus electors for the national popular-vote winner under the National Bonus Plan. */
export const BONUS_ELECTORS = 102;
/** Lodge–Gossett counts fractional electors to three decimal places. */
const PLACES = 1000;

/** Fractional electors: each candidate's exact share of the state's electors, to 3 places. */
export function fractional(popular: Votes, electoralVotes: number): Votes {
  const total = Object.values(popular).reduce((a, b) => a + b, 0);
  return Object.fromEntries(
    Object.entries(popular)
      .map(([id, n]) => [id, Math.round((n / total) * electoralVotes * PLACES) / PLACES] as const)
      .filter(([, n]) => n > 0),
  );
}

/**
 * Colorado Amendment 36 (2004): each ticket's share of the electors, rounded to the nearest whole
 * number (.5 up). If that over-allocates, the ticket with the fewest votes that still has an elector
 * loses one, then the next-fewest, and so on; any shortfall goes to the ticket with the most votes.
 */
export function proportional(popular: Votes, electoralVotes: number): Votes {
  const total = Object.values(popular).reduce((a, b) => a + b, 0);
  const seats: Record<string, number> = {};
  for (const [id, n] of Object.entries(popular)) {
    seats[id] = Math.floor((n / total) * electoralVotes + 0.5);
  }
  const fewestFirst = Object.keys(popular).toSorted((a, b) => popular[a]! - popular[b]!);
  let over = Object.values(seats).reduce((a, b) => a + b, 0) - electoralVotes;
  while (over > 0) {
    for (const id of fewestFirst) {
      if (over > 0 && seats[id]! > 0) {
        seats[id]!--;
        over--;
      }
    }
  }
  seats[leader(popular)]! -= over;
  return Object.fromEntries(Object.entries(seats).filter(([, n]) => n > 0));
}

/** Statewide winner takes the two "Senate" electors; the House electors split proportionally. */
export function districtStyle(popular: Votes, electoralVotes: number): Votes {
  const winner = leader(popular);
  const split = largestRemainder(popular, electoralVotes - 2);
  return { ...split, [winner]: (split[winner] ?? 0) + 2 };
}

/** Ranked-choice winner takes the state (Maine and Nebraska keep their district estimates). */
export function rankedChoice(result: StateResult, electoralVotes: number, t: Transfers): Votes {
  const winner = leader(instantRunoff(result.popular, t).at(-1)!);
  const plurality = allocate(result, electoralVotes, "popular");
  if (!result.districted) return { [winner]: electoralVotes };
  const first = leader(result.popular);
  if (winner === first) return plurality;
  const moved = { ...plurality, [first]: plurality[first]! - 2 };
  moved[winner] = (moved[winner] ?? 0) + 2;
  return Object.fromEntries(Object.entries(moved).filter(([, n]) => n > 0));
}

/** One state's electors under a voting system; states without popular-vote data keep `allocate`. */
export function allocateState(
  result: StateResult,
  electoralVotes: number,
  settings: Settings,
  transfers: Transfers,
): Votes {
  const { popular } = result;
  if (Object.keys(popular).length === 0)
    return allocate(result, electoralVotes, settings.allocation);
  switch (settings.system) {
    case "proportional":
      return proportional(popular, electoralVotes);
    case "fractional":
      return fractional(popular, electoralVotes);
    case "district":
      return districtStyle(popular, electoralVotes);
    case "ranked-choice":
      return rankedChoice(result, electoralVotes, transfers);
    case "national":
      return { [leader(popular)]: electoralVotes };
    default:
      return allocate(result, electoralVotes, settings.allocation);
  }
}
