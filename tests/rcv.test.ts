import { describe, expect, it } from "vitest";
import { instantRunoff } from "../src/engine/rcv.ts";

const t = { first: "d", second: "r", toFirst: { g: 0.8 } };

describe("instantRunoff", () => {
  it("stops at a first-round majority", () => {
    expect(instantRunoff({ d: 60, r: 30, g: 10, z: 0 }, t)).toEqual([{ d: 60, r: 30, g: 10 }]);
  });

  it("transfers a third party's votes by its share", () => {
    const rounds = instantRunoff({ d: 45, r: 47, g: 8 }, t);
    expect(rounds.at(-1)).toEqual({ d: 45 + 6.4, r: 47 + 1.6 });
  });

  it("splits evenly by default and spreads front-runners' votes", () => {
    expect(instantRunoff({ d: 45, r: 47, q: 8 }, t).at(-1)).toEqual({ d: 49, r: 51 });
    const rounds = instantRunoff({ x: 40, r: 35, d: 25 }, { ...t, toFirst: {} });
    // d is a front-runner but eliminated: its votes split evenly between x and r.
    expect(rounds.at(-1)).toEqual({ x: 52.5, r: 47.5 });
    const tie = instantRunoff({ a: 30, b: 30, d: 20, r: 20 }, { ...t, toFirst: {} });
    // r and d tie for last; the alphabetically last (r) goes first, then d's share.
    expect(Object.keys(tie[1]!)).toEqual(["a", "b", "d"]);
  });

  it("re-spreads votes meant for a candidate who is already out", () => {
    // r is out first; g's voters wanted r 100%, so they split evenly between d and x.
    const rounds = instantRunoff({ d: 40, x: 35, g: 14, r: 11 }, { ...t, toFirst: { g: 0 } });
    expect(rounds).toHaveLength(3);
    expect(rounds.at(-1)!.d).toBeCloseTo(52.5);
    expect(rounds.at(-1)!.x).toBeCloseTo(47.5);
  });
});
