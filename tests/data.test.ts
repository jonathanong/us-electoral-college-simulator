import { describe, expect, it } from "vitest";
import { dataset, files } from "../src/data/index.ts";
import { parseCsv } from "../src/data/csv.ts";
import { apportion } from "../src/engine/apportion.ts";
import { simulate, statePopulations } from "../src/engine/simulate.ts";
import { flips, sweep } from "../src/engine/sweep.ts";
import type { Settings } from "../src/engine/types.ts";
import { fullName } from "../src/ui/colors.ts";

const historical: Settings = {
  rule: { kind: "historical" },
  method: "huntington-hill",
  allocation: "electors",
};

const WINNERS: Record<number, string> = {
  1912: "Wilson",
  1916: "Wilson",
  1920: "Harding",
  1924: "Coolidge",
  1928: "Hoover",
  1932: "Roosevelt",
  1936: "Roosevelt",
  1940: "Roosevelt",
  1944: "Roosevelt",
  1948: "Truman",
  1952: "Eisenhower",
  1956: "Eisenhower",
  1960: "Kennedy",
  1964: "Johnson",
  1968: "Nixon",
  1972: "Nixon",
  1976: "Carter",
  1980: "Reagan",
  1984: "Reagan",
  1988: "Bush",
  1992: "Clinton",
  1996: "Clinton",
  2000: "Bush",
  2004: "Bush",
  2008: "Obama",
  2012: "Obama",
  2016: "Trump",
  2020: "Biden",
  2024: "Trump",
};

const years = [...dataset.elections.keys()];

describe("golden data", () => {
  it("covers every election from 1912 to 2024", () => {
    expect(years).toEqual(Object.keys(WINNERS).map(Number));
  });

  it.each(years)("%i: historical seats + 2 match electors cast in every state", (year) => {
    const sim = simulate(dataset, year, historical);
    for (const s of sim.states) {
      expect([s.state, s.electoralVotes]).toEqual([s.state, s.actualElectoralVotes]);
    }
    const expected = year <= 1956 ? 531 : year === 1960 ? 537 : 538;
    expect(sim.totalElectoralVotes).toBe(expected);
    const election = dataset.elections.get(year)!;
    expect(fullName(election.candidates, sim.actualWinner!)).toContain(WINNERS[year]);
    expect(sim.winner).toBe(sim.actualWinner);
  });

  it("references only known candidates", () => {
    for (const election of dataset.elections.values()) {
      const ids = new Set([...election.candidates.map((c) => c.id), "abstain"]);
      for (const s of election.states.values()) {
        for (const id of Object.keys(s.actual)) expect(ids).toContain(id);
      }
    }
  });

  it.each([1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020])(
    "Huntington-Hill reproduces the %i apportionment",
    (census) => {
      const election = dataset.elections.get(Math.ceil((census + 2) / 4) * 4)!;
      const pops = statePopulations(dataset, election, census);
      const seats = apportion(pops, 435, "huntington-hill");
      const actual = dataset.historicalSeats.get(census)!;
      for (const [state, n] of seats) expect([state, n]).toEqual([state, actual.get(state)]);
    },
  );

  it("parses every CSV with a header", () => {
    for (const text of Object.values(files)) expect(parseCsv(text).length).toBeGreaterThan(0);
  });
});

describe("published spot checks", () => {
  it("2024 with a cube-root House: 692 seats", () => {
    const sim = simulate(dataset, 2024, { ...historical, rule: { kind: "cube-root" } });
    expect(sim.houseSize).toBe(692);
    expect(sim.totalElectoralVotes).toBe(795);
  });

  it("2000: Bush below 491 seats, Gore above 635 (Neubauer & Zeitlin)", () => {
    const points = sweep(dataset, 2000, {
      method: "huntington-hill",
      allocation: "electors",
      minSize: 100,
      maxSize: 1000,
    });
    const winnerAt = (size: number) => points.find((p) => p.size === size)!.winner;
    const bush = winnerAt(435)!;
    for (const p of points) {
      if (p.size < 491) expect([p.size, p.winner]).toEqual([p.size, bush]);
      if (p.size > 655) expect([p.size, p.winner]).not.toEqual([p.size, bush]);
    }
    expect(flips(points).length).toBeGreaterThan(0);
  });
});
