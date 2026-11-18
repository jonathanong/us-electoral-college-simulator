import { describe, expect, it } from "vitest";
import {
  allocateState,
  districtStyle,
  fractional,
  proportional,
  rankedChoice,
} from "../src/engine/systems.ts";
import type { Settings, StateResult, VotingSystem } from "../src/engine/types.ts";

const transfers = { first: "d", second: "r", toFirst: { g: 1 } };

describe("proportional (Colorado Amendment 36)", () => {
  it("rounds to the nearest whole elector, .5 up", () => {
    expect(proportional({ a: 60, b: 40 }, 5)).toEqual({ a: 3, b: 2 });
  });

  it("takes over-allocations from the smallest ticket with an elector", () => {
    // 4.5, 2.7, 1.8 round to 5, 3, 2 = 10 of 9: c loses one.
    expect(proportional({ a: 50, b: 30, c: 20 }, 9)).toEqual({ a: 5, b: 3, c: 1 });
    // Every ticket rounds .5 up to 1: two over, so the two smallest (ties in order) lose theirs.
    expect(proportional({ a: 1, b: 1, c: 1, d: 1 }, 2)).toEqual({ c: 1, d: 1 });
  });

  it("gives any shortfall to the leader", () => {
    // 1.32, 1.32, 0.36 round to 1, 1, 0 = 2 of 3.
    expect(proportional({ a: 44, b: 44, c: 12 }, 3)).toEqual({ a: 2, b: 1 });
  });
});

describe("fractional (Lodge–Gossett)", () => {
  it("credits exact shares to three decimal places", () => {
    expect(fractional({ a: 1, b: 2 }, 1)).toEqual({ a: 0.333, b: 0.667 });
    expect(fractional({ a: 1, b: 0 }, 3)).toEqual({ a: 3 });
  });
});

describe("districtStyle", () => {
  it("gives the statewide winner two plus a proportional share", () => {
    expect(districtStyle({ a: 60, b: 40 }, 7)).toEqual({ a: 5, b: 2 });
    expect(districtStyle({ a: 99, b: 1 }, 3)).toEqual({ a: 3 });
    expect(districtStyle({ a: 1 }, 2)).toEqual({ a: 2 });
  });
});

const state: StateResult = {
  state: "XX",
  actual: {},
  pledged: { r: 5 },
  popular: { r: 45, d: 40, g: 15 },
  districted: false,
};

describe("rankedChoice", () => {
  it("gives the runoff winner every elector", () => {
    expect(rankedChoice(state, 7, transfers)).toEqual({ d: 7 });
  });

  it("moves only the at-large electors in districted states", () => {
    const ne = { ...state, districted: true, pledged: { r: 4, d: 1 } };
    // Plurality: r 2 at-large + district split scaled from 3 r, 1 d.
    expect(rankedChoice(ne, 6, { ...transfers, toFirst: {} })).toEqual({ r: 5, d: 1 });
    expect(rankedChoice(ne, 6, transfers)).toEqual({ r: 3, d: 3 });
    expect(rankedChoice({ ...ne, pledged: { r: 5 } }, 5, transfers)).toEqual({ r: 3, d: 2 });
  });
});

describe("allocateState", () => {
  const settings = (system: VotingSystem): Settings => ({
    rule: { kind: "historical" },
    method: "huntington-hill",
    allocation: "popular",
    system,
    transfers: {},
  });
  const results: Record<VotingSystem, object> = {
    "winner-take-all": { r: 5 },
    bonus: { r: 5 },
    national: { r: 5 },
    proportional: { r: 2, d: 2, g: 1 },
    fractional: { r: 2.25, d: 2, g: 0.75 },
    district: { r: 3, d: 1, g: 1 },
    "ranked-choice": { d: 5 },
  };

  it("dispatches each voting system", () => {
    for (const [system, expected] of Object.entries(results)) {
      expect(allocateState(state, 5, settings(system as VotingSystem), transfers)).toEqual(
        expected,
      );
    }
  });

  it("falls back to the elector split without popular votes", () => {
    const blank = { ...state, popular: {} };
    expect(allocateState(blank, 10, settings("proportional"), transfers)).toEqual({ r: 10 });
  });
});

describe("transferCandidates", () => {
  it("lists everyone but the front-runners, biggest first and others last", async () => {
    const { transferCandidates } = await import("../src/ui/MethodControls.tsx");
    const popular = { d: 50, r: 40, p: 3, other: 9, g: 5 };
    const election = {
      year: 2000,
      candidates: [],
      states: new Map([["XX", { ...state, popular }]]),
    };
    expect(transferCandidates(election)).toEqual(["g", "p", "other"]);
  });
});
