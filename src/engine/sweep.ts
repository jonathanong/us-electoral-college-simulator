import { allocate } from "./allocate.ts";
import { apportion, seatSequence } from "./apportion.ts";
import {
  electoralVotesFor,
  getElection,
  statePopulations,
  sumVotes,
  winnerOf,
} from "./simulate.ts";
import { censusFor } from "./house.ts";
import type { Allocation, Dataset, Method, StateCode, Votes } from "./types.ts";

export interface SweepPoint {
  size: number;
  totals: Votes;
  totalElectoralVotes: number;
  winner: string | null;
}

export interface SweepOptions {
  method: Method;
  allocation: Allocation;
  minSize: number;
  maxSize: number;
}

/** Outcome of one election at every House size in [minSize, maxSize]. */
export function sweep(data: Dataset, year: number, options: SweepOptions): SweepPoint[] {
  const election = getElection(data, year);
  const census = censusFor(year, { kind: "fixed", size: 0 });
  const pops = statePopulations(data, election, census);
  const minSize = Math.max(options.minSize, pops.size);
  const results = election.states;

  const pointFor = (size: number, seats: ReadonlyMap<StateCode, number>): SweepPoint => {
    const ev = electoralVotesFor(data, election, census, seats, pops, false);
    const rows = [...ev].map(([s, n]) => allocate(results.get(s)!, n, options.allocation));
    const totals = sumVotes(rows);
    const total = [...ev.values()].reduce((a, b) => a + b, 0);
    return { size, totals, totalElectoralVotes: total, winner: winnerOf(totals, total) };
  };

  const points: SweepPoint[] = [];
  if (options.method === "hamilton") {
    for (let size = minSize; size <= options.maxSize; size++) {
      points.push(pointFor(size, apportion(pops, size, "hamilton")));
    }
    return points;
  }
  const order = seatSequence(pops, options.method, options.maxSize);
  const seats = new Map<StateCode, number>([...pops.keys()].map((s) => [s, 1]));
  for (let size = pops.size; size <= options.maxSize; size++) {
    if (size > pops.size) {
      const state = order[size - pops.size - 1]!;
      seats.set(state, seats.get(state)! + 1);
    }
    if (size >= minSize) points.push(pointFor(size, seats));
  }
  return points;
}

/** House sizes at which the winner differs from the previous size. */
export function flips(points: readonly SweepPoint[]): SweepPoint[] {
  return points.filter((p, i) => i > 0 && p.winner !== points[i - 1]!.winner);
}
