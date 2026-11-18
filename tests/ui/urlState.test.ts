import { describe, expect, it } from "vitest";
import { candidateColor, fullName, partyColor, shortName } from "../../src/ui/colors.ts";
import { DEFAULT_STATE, parseState, serializeState } from "../../src/ui/urlState.ts";

const years = [2000, 2024];

describe("parseState", () => {
  it("falls back to defaults", () => {
    expect(parseState("", years)).toEqual(DEFAULT_STATE);
    expect(parseState("?year=1999&method=nope&alloc=nope&rule=nope", years)).toEqual(DEFAULT_STATE);
  });

  it("reads every rule kind", () => {
    const rule = (q: string) => parseState(q, years).settings.rule;
    expect(rule("?rule=historical")).toEqual({ kind: "historical" });
    expect(rule("?rule=wyoming")).toEqual({ kind: "wyoming" });
    expect(rule("?rule=fixed&size=700")).toEqual({ kind: "fixed", size: 700 });
    expect(rule("?rule=fixed&size=-3")).toEqual({ kind: "fixed", size: 435 });
    expect(rule("?rule=fixed&size=99999999")).toEqual({ kind: "fixed", size: 5000 });
    expect(rule("?rule=fixed&size=3")).toEqual({ kind: "fixed", size: 48 });
    expect(rule("?rule=ratio&perRep=1")).toEqual({ kind: "ratio", perRep: 30000 });
    expect(rule("?rule=custom&sizes=2020:90000000")).toEqual({
      kind: "custom",
      sizes: { 2020: 5000 },
    });
    expect(rule("?rule=ratio&perRep=40000")).toEqual({ kind: "ratio", perRep: 40000 });
    expect(rule("?rule=custom&sizes=1910:500,2020:900,bad,1950:0")).toEqual({
      kind: "custom",
      sizes: { 1910: 500, 2020: 900 },
    });
    expect(rule("?rule=custom")).toEqual({ kind: "custom", sizes: {} });
  });

  it("reads year, method and allocation", () => {
    const s = parseState("?year=2000&method=webster&alloc=popular", years);
    expect(s.year).toBe(2000);
    expect(s.settings.method).toBe("webster");
    expect(s.settings.allocation).toBe("popular");
  });
});

describe("voting system state", () => {
  it("reads the system and clamps ranked-choice percentages", () => {
    const s = parseState(
      "?system=ranked-choice&rcv=1992.perot:150,bad,1992.x:abc,19.y:5,1992.z:,2000.nader:-4",
      years,
    ).settings;
    expect(s.system).toBe("ranked-choice");
    expect(s.transfers).toEqual({ "1992.perot": 100, "2000.nader": 0 });
    expect(parseState("?system=nope", years).settings.system).toBe("winner-take-all");
  });
});

describe("serializeState", () => {
  it("round-trips", () => {
    for (const q of [
      "?year=2000&rule=fixed&size=700&method=webster&alloc=popular",
      "?year=2024&rule=ratio&perRep=40000",
      "?year=2024&rule=custom&sizes=1910%3A500%2C2020%3A900",
      "?year=2024&rule=cube-root",
      "?year=2024&rule=cube-root&system=ranked-choice&rcv=1992.perot%3A60%2C2000.nader%3A70",
    ]) {
      expect(serializeState(parseState(q, years))).toBe(q);
    }
  });
});

describe("colors", () => {
  const cands = [
    { id: "a", name: "Joseph R. Biden Jr.", party: "D" },
    { id: "b", name: "Mystery Person", party: "Whig" },
    { id: "c", name: "Robert M. La Follette", party: "Progressive" },
  ];

  it("maps parties and falls back by index", () => {
    expect(partyColor("R")).toBe("var(--rep)");
    expect(partyColor(undefined)).toBe("var(--other1)");
    expect(candidateColor(cands, "b")).toBe("var(--other2)");
    expect(candidateColor(cands, "zzz")).toBe("var(--other1)");
    expect(candidateColor(cands, null)).toBe("var(--muted)");
  });

  it("formats names", () => {
    expect(shortName(cands, "a")).toBe("Biden");
    expect(shortName(cands, "c")).toBe("La Follette");
    expect(shortName([{ id: "x", name: "Cher", party: "R" }], "x")).toBe("Cher");
    expect(shortName(cands, "zzz")).toBe("zzz");
    expect(shortName(cands, null)).toBe("No majority");
    expect(fullName(cands, "b")).toBe("Mystery Person");
    expect(fullName(cands, "q")).toBe("q");
  });
});
