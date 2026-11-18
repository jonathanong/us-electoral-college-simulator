import type { Simulation } from "../../src/engine/types.ts";

export const candidates = [
  { id: "d", name: "Al Gore", party: "D" },
  { id: "r", name: "George W. Bush", party: "R" },
];

export function sim(over: Partial<Simulation>): Simulation {
  return {
    year: 2000,
    system: "winner-take-all",
    bonus: {},
    popular: {},
    census: 1990,
    houseSize: 435,
    states: [],
    totals: { r: 271, d: 267 },
    totalElectoralVotes: 538,
    majority: 270,
    winner: "r",
    actualWinner: "r",
    ...over,
  };
}
