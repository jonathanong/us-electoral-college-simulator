import { describe, expect, it } from "vitest";
import { allocate, largestRemainder, leader } from "../src/engine/allocate.ts";
import type { StateResult } from "../src/engine/types.ts";

const base: StateResult = {
  state: "XX",
  actual: {},
  pledged: { r: 4, d: 1 },
  popular: { r: 300, d: 320 },
  districted: false,
};

describe("leader", () => {
  it("picks the most votes, ties alphabetical", () => {
    expect(leader({ b: 2, a: 2, c: 1 })).toBe("a");
    expect(leader({ b: 3, a: 2 })).toBe("b");
  });
});

describe("largestRemainder", () => {
  it("splits proportionally", () => {
    expect(largestRemainder({ a: 2, b: 1 }, 7)).toEqual({ a: 5, b: 2 });
    expect(largestRemainder({ a: 1, b: 1, z: 0 }, 3)).toEqual({ a: 2, b: 1 });
    expect(largestRemainder({ b: 1, a: 1 }, 1)).toEqual({ a: 1 });
  });
});

describe("allocate", () => {
  it("scales the pledged split in elector mode", () => {
    expect(allocate(base, 10, "electors")).toEqual({ r: 8, d: 2 });
    expect(allocate({ ...base, pledged: { r: 5 } }, 12, "electors")).toEqual({ r: 12 });
  });

  it("gives the popular winner everything in popular mode", () => {
    expect(allocate(base, 10, "popular")).toEqual({ d: 10 });
  });

  it("falls back to electors when popular votes are missing", () => {
    expect(allocate({ ...base, popular: {} }, 5, "popular")).toEqual({ r: 4, d: 1 });
  });

  it("splits districted states: 2 at-large plus scaled districts", () => {
    const ne = { ...base, districted: true };
    expect(allocate(ne, 8, "electors")).toEqual({ r: 6, d: 2 });
    expect(allocate(ne, 8, "popular")).toEqual({ r: 4, d: 4 });
    const sweptByR = { ...ne, pledged: { r: 5 } };
    expect(allocate(sweptByR, 5, "popular")).toEqual({ r: 3, d: 2 });
  });
});
