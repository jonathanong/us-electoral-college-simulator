import { describe, expect, it } from "vitest";
import { bonusFor, decide, frontRunners, transfersFor } from "../src/engine/national.ts";
import type { Settings, VotingSystem } from "../src/engine/types.ts";

const settings = (system: VotingSystem, transfers = {}): Settings => ({
  rule: { kind: "historical" },
  method: "huntington-hill",
  allocation: "electors",
  system,
  transfers,
});

describe("frontRunners and transfersFor", () => {
  it("ignores unlisted votes and reads this year's percentages", () => {
    expect(frontRunners({ other: 99, a: 10, b: 20, c: 5 })).toEqual(["b", "a"]);
    expect(frontRunners({})).toEqual(["", ""]);
    const t = transfersFor(
      1992,
      { d: 3, r: 2, p: 1 },
      settings("ranked-choice", {
        "1992.p": 70,
        "1996.p": 10,
        "1992.": 5,
      }),
    );
    expect(t).toEqual({ first: "d", second: "r", toFirst: { p: 0.7 } });
  });
});

describe("bonusFor", () => {
  it("gives 102 electors to the popular-vote winner under the bonus plan only", () => {
    expect(bonusFor(settings("bonus"), { a: 2, b: 1 })).toEqual({ a: 102 });
    expect(bonusFor(settings("bonus"), {})).toEqual({});
    expect(bonusFor(settings("winner-take-all"), { a: 2 })).toEqual({});
  });
});

describe("decide", () => {
  it("needs a majority of electors by default", () => {
    expect(decide(settings("proportional"), { a: 5, b: 5 }, 10, {})).toEqual({
      majority: 6,
      winner: null,
    });
    expect(decide(settings("bonus"), { a: 6, b: 4 }, 10, {}).winner).toBe("a");
    expect(decide(settings("winner-take-all"), {}, 0, {}).winner).toBeNull();
  });

  it("uses the national plurality under a national popular vote", () => {
    expect(decide(settings("national"), { a: 9 }, 10, { a: 4, b: 5 }).winner).toBe("b");
    expect(decide(settings("national"), { a: 9 }, 10, {}).winner).toBe("a");
  });

  it("gives Lodge–Gossett to the most electoral votes, ties to the popular vote", () => {
    const s = settings("fractional");
    expect(decide(s, { a: 4.5, b: 3, c: 2.5 }, 10, {}).winner).toBe("a");
    expect(decide(s, { a: 5, b: 5 }, 10, { a: 1, b: 2 }).winner).toBe("b");
    expect(decide(s, { a: 5, b: 5 }, 10, {}).winner).toBe("a");
    expect(decide(s, {}, 0, {}).winner).toBeNull();
  });
});
