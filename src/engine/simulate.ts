import { leader } from "./allocate.ts";
import { apportion, seatsAsIfState } from "./apportion.ts";
import { censusFor, houseSize, majorityOf } from "./house.ts";
import { bonusFor, decide, nationalPopular, sumVotes, transfersFor } from "./national.ts";
import { allocateState } from "./systems.ts";
import type { Dataset, Election, Settings, Simulation, StateCode, Votes } from "./types.ts";

export function getElection(data: Dataset, year: number): Election {
  const election = data.elections.get(year);
  if (!election) throw new RangeError(`No election data for ${year}`);
  return election;
}

/** Populations of the states (not DC) voting in an election, from the given census. */
export function statePopulations(
  data: Dataset,
  election: Election,
  census: number,
): Map<StateCode, number> {
  const pops = data.populations.get(census)!;
  const result = new Map<StateCode, number>();
  for (const state of election.states.keys()) {
    if (state !== "DC") result.set(state, pops.get(state)!);
  }
  return result;
}

/** House seats per state (DC excluded) for an election under the settings. */
export function seatsFor(
  data: Dataset,
  election: Election,
  settings: Settings,
): { census: number; seats: Map<StateCode, number>; pops: Map<StateCode, number> } {
  const census = censusFor(election.year, settings.rule);
  const pops = statePopulations(data, election, census);
  if (settings.rule.kind === "historical") {
    const table = data.historicalSeats.get(census)!;
    return { census, pops, seats: new Map([...pops.keys()].map((s) => [s, table.get(s)!])) };
  }
  const size = houseSize(settings.rule, census, pops);
  return { census, pops, seats: apportion(pops, size, settings.method) };
}

/** Electoral votes per state (DC included when it votes). */
export function electoralVotesFor(
  data: Dataset,
  election: Election,
  census: number,
  seats: ReadonlyMap<StateCode, number>,
  pops: ReadonlyMap<StateCode, number>,
  historical: boolean,
): Map<StateCode, number> {
  const ev = new Map([...seats].map(([s, n]) => [s, n + 2]));
  if (election.states.has("DC")) {
    const smallest = Math.min(...seats.values());
    const dcPop = data.populations.get(census)!.get("DC")!;
    const dcSeats = historical ? 1 : seatsAsIfState(dcPop, pops, seats);
    ev.set("DC", Math.min(dcSeats, smallest) + 2);
  }
  return ev;
}

export function winnerOf(totals: Votes, total: number): string | null {
  const top = leader(totals);
  return (totals[top] ?? 0) >= majorityOf(total) ? top : null;
}

const sumOf = (votes: Votes) => Object.values(votes).reduce((a, b) => a + b, 0);

export function simulate(data: Dataset, year: number, settings: Settings): Simulation {
  const election = getElection(data, year);
  const { census, seats, pops } = seatsFor(data, election, settings);
  const historical = settings.rule.kind === "historical";
  const ev = electoralVotesFor(data, election, census, seats, pops, historical);
  const popular = nationalPopular(election);
  const transfers = transfersFor(year, popular, settings);
  const states = [...election.states.values()].map((result) => {
    const electoralVotes = ev.get(result.state)!;
    const allocation = allocateState(result, electoralVotes, settings, transfers);
    return {
      state: result.state,
      seats: seats.get(result.state) ?? 0,
      electoralVotes,
      actualElectoralVotes: Object.values(result.actual).reduce((a, b) => a + b, 0),
      allocation,
      winner: leader(allocation),
    };
  });
  const bonus = bonusFor(settings, popular);
  const totals = sumVotes([...states.map((s) => s.allocation), bonus]);
  const totalElectoralVotes = states.reduce((a, s) => a + s.electoralVotes, 0) + sumOf(bonus);
  const actualTotals = sumVotes([...election.states.values()].map((s) => s.actual));
  const actualTotal = states.reduce((a, s) => a + s.actualElectoralVotes, 0);
  return {
    year,
    system: settings.system,
    census,
    houseSize: [...seats.values()].reduce((a, b) => a + b, 0),
    states,
    totals,
    totalElectoralVotes,
    ...decide(settings, totals, totalElectoralVotes, popular),
    bonus,
    popular,
    actualWinner: winnerOf(actualTotals, actualTotal),
  };
}
