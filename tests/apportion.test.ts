import { describe, expect, it } from "vitest";
import { apportion, priority, seatSequence, seatsAsIfState } from "../src/engine/apportion.ts";

const pops = new Map([
  ["A", 6_000_000],
  ["B", 3_000_000],
  ["C", 1_000_000],
]);

describe("apportion", () => {
  it("gives every state one seat, then follows priority values", () => {
    expect(Object.fromEntries(apportion(pops, 10, "huntington-hill"))).toEqual({
      A: 6,
      B: 3,
      C: 1,
    });
    expect(Object.fromEntries(apportion(pops, 3, "webster"))).toEqual({ A: 1, B: 1, C: 1 });
  });

  it("is house-monotone for divisor methods", () => {
    const order = seatSequence(pops, "jefferson", 20);
    expect(order).toHaveLength(17);
    const at19 = apportion(pops, 19, "jefferson");
    const at20 = apportion(pops, 20, "jefferson");
    expect(at20.get(order[16]!)).toBe(at19.get(order[16]!)! + 1);
  });

  it("breaks exact priority ties by state code", () => {
    const tied = new Map([
      ["Y", 100],
      ["X", 100],
    ]);
    expect(seatSequence(tied, "webster", 3)).toEqual(["X"]);
  });

  it("implements Hamilton's largest-remainder method with a one-seat floor", () => {
    expect(Object.fromEntries(apportion(pops, 10, "hamilton"))).toEqual({ A: 6, B: 3, C: 1 });
    expect(Object.fromEntries(apportion(pops, 11, "hamilton"))).toEqual({ A: 7, B: 3, C: 1 });
    const skewed = new Map([
      ["A", 1_000_000],
      ["B", 1],
      ["C", 1],
      ["D", 1],
    ]);
    const even = new Map([
      ["B", 10],
      ["A", 10],
    ]);
    expect(Object.fromEntries(apportion(even, 3, "hamilton"))).toEqual({ A: 2, B: 1 });
    expect(Object.fromEntries(apportion(skewed, 5, "hamilton"))).toEqual({
      A: 2,
      B: 1,
      C: 1,
      D: 1,
    });
  });

  it("rejects House sizes smaller than the number of states", () => {
    expect(() => apportion(pops, 2, "huntington-hill")).toThrow(RangeError);
    expect(() => apportion(pops, 4.5, "hamilton")).toThrow(RangeError);
  });

  it("computes Huntington-Hill priority values", () => {
    expect(priority(100, 1, "huntington-hill")).toBeCloseTo(100 / Math.SQRT2);
  });
});

describe("seatsAsIfState", () => {
  it("counts DC priority values that beat the last state seat", () => {
    const seats = apportion(pops, 10, "huntington-hill");
    expect(seatsAsIfState(700_000, pops, seats)).toBe(1);
    // Last state seat priority: A's 6th = 6M/√30 ≈ 1.095M. DC: 2.5M/√2 beats it, 2.5M/√6 does not.
    expect(seatsAsIfState(2_500_000, pops, seats)).toBe(2);
  });

  it("gives one seat when no state has more than one", () => {
    expect(seatsAsIfState(9e9, pops, apportion(pops, 3, "huntington-hill"))).toBe(1);
  });
});
