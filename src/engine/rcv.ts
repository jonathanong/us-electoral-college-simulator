import { leader } from "./allocate.ts";
import type { Votes } from "./types.ts";

/**
 * Where eliminated candidates' votes go. We have no ranked ballots, so each eliminated candidate's
 * voters are assumed to rank one of the two national front-runners next: `toFirst[id]` (0–1) go to
 * `first`, the rest to `second`. Front-runners' own voters, and votes meant for a candidate who is
 * already out, are split evenly among the candidates still running.
 */
export interface Transfers {
  first: string;
  second: string;
  toFirst: Readonly<Record<string, number>>;
}

export const EVEN_SPLIT = 0.5;

/** Candidate eliminated next: fewest votes, ties broken by the alphabetically last id. */
function weakest(votes: Votes): string {
  let worst = "";
  let worstVotes = Infinity;
  for (const [id, n] of Object.entries(votes)) {
    if (n < worstVotes || (n === worstVotes && id > worst)) {
      worst = id;
      worstVotes = n;
    }
  }
  return worst;
}

/** Instant runoff on first-choice votes. Returns each round's tallies; the last has the winner. */
export function instantRunoff(first: Votes, transfers: Transfers): Votes[] {
  let tally: Record<string, number> = Object.fromEntries(
    Object.entries(first).filter(([, n]) => n > 0),
  );
  const rounds: Votes[] = [tally];
  for (;;) {
    const ids = Object.keys(tally);
    const total = Object.values(tally).reduce((a, b) => a + b, 0);
    if (ids.length <= 2 || tally[leader(tally)]! * 2 > total) return rounds;
    const out = weakest(tally);
    const votes = tally[out]!;
    const next: Record<string, number> = { ...tally };
    delete next[out];
    const frontRunner = out === transfers.first || out === transfers.second;
    const share = frontRunner ? 0 : (transfers.toFirst[out] ?? EVEN_SPLIT);
    const intended: [string, number][] = frontRunner
      ? []
      : [
          [transfers.first, votes * share],
          [transfers.second, votes * (1 - share)],
        ];
    let spread = frontRunner ? votes : 0;
    for (const [id, n] of intended) {
      if (id in next) next[id]! += n;
      else spread += n;
    }
    const remaining = Object.keys(next);
    for (const id of remaining) next[id]! += spread / remaining.length;
    tally = next;
    rounds.push(tally);
  }
}
