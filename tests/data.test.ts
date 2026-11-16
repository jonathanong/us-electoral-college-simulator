import { describe, expect, it } from "vitest";
import { dataset, files } from "../src/data/index.ts";
import { parseCsv } from "../src/data/csv.ts";
import { apportion } from "../src/engine/apportion.ts";
import { simulate, statePopulations } from "../src/engine/simulate.ts";
import { flips, sweep } from "../src/engine/sweep.ts";
import type { Settings } from "../src/engine/types.ts";
import { fullName, shortName } from "../src/ui/colors.ts";

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

/** Electoral votes actually cast, by surname (National Archives). */
const CAST: Record<number, Record<string, number>> = {
  1912: { Wilson: 435, Roosevelt: 88, Taft: 8 },
  1916: { Wilson: 277, Hughes: 254 },
  1920: { Harding: 404, Cox: 127 },
  1924: { Coolidge: 382, Davis: 136, "La Follette": 13 },
  1928: { Hoover: 444, Smith: 87 },
  1932: { Roosevelt: 472, Hoover: 59 },
  1936: { Roosevelt: 523, Landon: 8 },
  1940: { Roosevelt: 449, Willkie: 82 },
  1944: { Roosevelt: 432, Dewey: 99 },
  1948: { Truman: 303, Dewey: 189, Thurmond: 39 },
  1952: { Eisenhower: 442, Stevenson: 89 },
  1956: { Eisenhower: 457, Stevenson: 73, Jones: 1 },
  1960: { Kennedy: 303, Nixon: 219, Byrd: 15 },
  1964: { Johnson: 486, Goldwater: 52 },
  1968: { Nixon: 301, Humphrey: 191, Wallace: 46 },
  1972: { Nixon: 520, McGovern: 17, Hospers: 1 },
  1976: { Carter: 297, Ford: 240, Reagan: 1 },
  1980: { Reagan: 489, Carter: 49 },
  1984: { Reagan: 525, Mondale: 13 },
  1988: { Bush: 426, Dukakis: 111, Bentsen: 1 },
  1992: { Clinton: 370, Bush: 168 },
  1996: { Clinton: 379, Dole: 159 },
  2000: { Bush: 271, Gore: 266, abstain: 1 },
  2004: { Bush: 286, Kerry: 251, Edwards: 1 },
  2008: { Obama: 365, McCain: 173 },
  2012: { Obama: 332, Romney: 206 },
  2016: { Trump: 304, Clinton: 227, Powell: 3, Kasich: 1, Paul: 1, Sanders: 1, Eagle: 1 },
  2020: { Biden: 306, Trump: 232 },
  2024: { Trump: 312, Harris: 226 },
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

  it.each(years)("%i: national electoral votes cast match the official totals", (year) => {
    const election = dataset.elections.get(year)!;
    const totals: Record<string, number> = {};
    for (const s of election.states.values()) {
      for (const [id, n] of Object.entries(s.actual)) {
        const name = id === "abstain" ? id : shortName(election.candidates, id);
        totals[name] = (totals[name] ?? 0) + n;
      }
    }
    expect(totals).toEqual(CAST[year]);
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
    const trump = sim.winner!;
    expect(sim.totals[trump]).toBe(462);
    expect(sim.totalElectoralVotes - sim.totals[trump]!).toBe(333);
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
