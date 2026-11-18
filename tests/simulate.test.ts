import { describe, expect, it } from "vitest";
import { simulate, winnerOf } from "../src/engine/simulate.ts";
import { flips, sweep } from "../src/engine/sweep.ts";
import type { Settings } from "../src/engine/types.ts";
import { data } from "./fixture.ts";

const historical: Settings = {
  rule: { kind: "historical" },
  method: "huntington-hill",
  allocation: "electors",
  system: "winner-take-all",
  transfers: {},
};

describe("simulate", () => {
  it("reproduces the actual result with historical seats", () => {
    const sim = simulate(data, 1992, historical);
    expect(sim.census).toBe(1990);
    expect(sim.houseSize).toBe(10);
    expect(sim.totalElectoralVotes).toBe(19);
    expect(sim.majority).toBe(10);
    expect(sim.totals).toEqual({ dem: 12, rep: 7 });
    expect(sim.winner).toBe("dem");
    expect(sim.actualWinner).toBe("dem");
    const dc = sim.states.find((s) => s.state === "DC")!;
    expect(dc).toMatchObject({
      seats: 0,
      electoralVotes: 3,
      actualElectoralVotes: 3,
      winner: "dem",
    });
  });

  it("re-apportions under a counterfactual rule and caps DC at the smallest state", () => {
    const sim = simulate(data, 1992, { ...historical, rule: { kind: "fixed", size: 100 } });
    expect(sim.houseSize).toBe(100);
    const ev = Object.fromEntries(sim.states.map((s) => [s.state, s.electoralVotes]));
    expect(ev).toEqual({ CA: 62, NE: 32, WY: 12, DC: 9 });
  });

  it("lets the popular winner take each state, keeping district estimates", () => {
    const sim = simulate(data, 1992, {
      ...historical,
      allocation: "popular",
      system: "winner-take-all",
      transfers: {},
    });
    expect(sim.totals).toEqual({ dem: 15, rep: 4 });
  });

  it("reports no winner when nobody reaches a majority", () => {
    expect(winnerOf({ a: 5, b: 5 }, 10)).toBeNull();
    expect(winnerOf({ a: 6, b: 4 }, 10)).toBe("a");
    expect(winnerOf({}, 0)).toBeNull();
  });

  it("handles elections without DC", () => {
    const sim = simulate(data, 1996, historical);
    expect(sim.totals).toEqual({ dem: 8 });
  });

  it("throws for unknown years", () => {
    expect(() => simulate(data, 1800, historical)).toThrow(RangeError);
  });
});

describe("voting systems in simulate and sweep", () => {
  it("adds bonus electors and matches the sweep at the same size", () => {
    const settings: Settings = {
      ...historical,
      rule: { kind: "fixed", size: 20 },
      system: "bonus",
    };
    const sim = simulate(data, 1992, settings);
    expect(sim.bonus).toEqual({ dem: 102 });
    expect(sim.totalElectoralVotes).toBe(
      sim.states.reduce((a, s) => a + s.electoralVotes, 0) + 102,
    );
    const point = sweep(data, 1992, { ...settings, minSize: 20, maxSize: 20 })[0]!;
    expect(point.totals).toEqual(sim.totals);
    expect(point.winner).toBe(sim.winner);
    expect(sim.popular).toEqual({ dem: 940, rep: 840, other: 50 });
    const fractional = {
      ...settings,
      rule: { kind: "fixed" as const, size: 3 },
      system: "fractional" as const,
    };
    const frac = sweep(data, 1992, { ...fractional, minSize: 3, maxSize: 3 })[0]!;
    expect(frac.totalElectoralVotes).toBe(simulate(data, 1992, fractional).totalElectoralVotes);
  });
});

describe("sweep", () => {
  it("evaluates every House size for divisor and Hamilton methods", () => {
    const hh = sweep(data, 1992, {
      method: "huntington-hill",
      allocation: "popular",
      system: "winner-take-all",
      transfers: {},
      minSize: 1,
      maxSize: 30,
    });
    expect(hh[0]!.size).toBe(3);
    expect(hh.at(-1)!.size).toBe(30);
    const direct = simulate(data, 1992, {
      rule: { kind: "fixed", size: 30 },
      method: "huntington-hill",
      allocation: "popular",
      system: "winner-take-all",
      transfers: {},
    });
    expect(hh.at(-1)!.totals).toEqual(direct.totals);
    const ham = sweep(data, 1992, {
      method: "hamilton",
      allocation: "electors",
      system: "winner-take-all",
      transfers: {},
      minSize: 10,
      maxSize: 12,
    });
    const late = sweep(data, 1992, {
      method: "webster",
      allocation: "electors",
      system: "winner-take-all",
      transfers: {},
      minSize: 10,
      maxSize: 11,
    });
    expect(late.map((p) => p.size)).toEqual([10, 11]);
    expect(ham.map((p) => p.size)).toEqual([10, 11, 12]);
  });

  it("finds sizes where the winner changes", () => {
    const points = sweep(data, 1992, {
      method: "webster",
      allocation: "popular",
      system: "winner-take-all",
      transfers: {},
      minSize: 3,
      maxSize: 60,
    });
    const changed = flips(points);
    for (const p of changed) {
      const prev = points[points.indexOf(p) - 1]!;
      expect(p.winner).not.toBe(prev.winner);
    }
    expect(flips([])).toEqual([]);
  });
});
