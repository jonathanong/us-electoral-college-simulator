import { describe, expect, it } from "vitest";
import { parseCsv, toInt } from "../src/data/csv.ts";
import { CODE_BY_FIPS, stateName } from "../src/data/states.ts";
import { data } from "./fixture.ts";

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, CRLF and blank lines", () => {
    expect(parseCsv('a,b\r\n"1,000","say ""hi"""\r\n\r\nx,y')).toEqual([
      { a: "1,000", b: 'say "hi"' },
      { a: "x", b: "y" },
    ]);
    expect(parseCsv("a,b\n1\n")).toEqual([{ a: "1", b: "" }]);
    expect(parseCsv("")).toEqual([]);
  });
});

describe("toInt", () => {
  it("parses numbers with separators", () => {
    expect(toInt("1,234")).toBe(1234);
    expect(toInt(" ")).toBeUndefined();
    expect(toInt(undefined)).toBeUndefined();
    expect(() => toInt("abc")).toThrow(TypeError);
  });
});

describe("states", () => {
  it("maps codes, names and FIPS", () => {
    expect(stateName("WY")).toBe("Wyoming");
    expect(stateName("PR")).toBe("PR");
    expect(CODE_BY_FIPS.get("11")).toBe("DC");
  });
});

describe("buildDataset", () => {
  it("loads census populations, seats and admission seats", () => {
    expect(data.populations.get(1990)!.get("CA")).toBe(6_000_000);
    expect(data.populations.get(2000)!.get("WY")).toBe(1_000_001);
    expect(data.historicalSeats.get(1990)!.get("DC")).toBeUndefined();
    expect(data.historicalSeats.get(1910)!.get("AZ")).toBe(1);
  });

  it("builds elections with pledged splits and district flags", () => {
    const e = data.elections.get(1992)!;
    expect(e.candidates.map((c) => c.id)).toEqual(["dem", "rep", "ind"]);
    expect([...e.states.keys()]).toEqual(["CA", "DC", "NE", "WY"]);
    expect(e.states.get("WY")).toMatchObject({ actual: { ind: 3 }, pledged: { rep: 3 } });
    expect(e.states.get("DC")!.pledged).toEqual({ dem: 3 });
    expect(e.states.get("DC")!.popular).toEqual({});
    expect(e.states.get("NE")!.districted).toBe(true);
    expect(e.states.get("CA")!.districted).toBe(false);
    expect([...data.elections.keys()]).toEqual([1992, 1996]);
    expect(data.elections.get(1996)!.candidates).toEqual([]);
  });
});
