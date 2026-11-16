import { describe, expect, it } from "vitest";
import { censusFor, houseSize, majorityOf } from "../src/engine/house.ts";

const pops = new Map([
  ["A", 8_000_000],
  ["B", 1_000_000],
]);

describe("censusFor", () => {
  it("keeps the 1910 apportionment through 1928 historically", () => {
    expect(censusFor(1912, { kind: "historical" })).toBe(1910);
    expect(censusFor(1928, { kind: "historical" })).toBe(1910);
    expect(censusFor(1932, { kind: "historical" })).toBe(1930);
  });

  it("reapportions after 1920 in counterfactuals", () => {
    expect(censusFor(1924, { kind: "cube-root" })).toBe(1920);
    expect(censusFor(2020, { kind: "cube-root" })).toBe(2010);
    expect(censusFor(2024, { kind: "wyoming" })).toBe(2020);
  });
});

describe("houseSize", () => {
  it("applies each rule", () => {
    expect(houseSize({ kind: "fixed", size: 600 }, 2020, pops)).toBe(600);
    expect(houseSize({ kind: "cube-root" }, 2020, pops)).toBe(Math.round(Math.cbrt(9_000_000)));
    expect(houseSize({ kind: "wyoming" }, 2020, pops)).toBe(9);
    expect(houseSize({ kind: "ratio", perRep: 30_000 }, 2020, pops)).toBe(300);
    expect(houseSize({ kind: "custom", sizes: { 2020: 700 } }, 2020, pops)).toBe(700);
    expect(houseSize({ kind: "custom", sizes: {} }, 2010, pops)).toBe(435);
  });

  it("never returns fewer seats than states", () => {
    expect(houseSize({ kind: "fixed", size: 1 }, 2020, pops)).toBe(2);
  });
});

describe("majorityOf", () => {
  it("is more than half", () => {
    expect(majorityOf(538)).toBe(270);
    expect(majorityOf(531)).toBe(266);
  });
});
