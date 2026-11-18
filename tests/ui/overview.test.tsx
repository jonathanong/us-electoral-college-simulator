import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import type { Simulation } from "../../src/engine/types.ts";
import { Overview, flippedYears, methodRows } from "../../src/ui/Overview.tsx";
import { data as fixture } from "../fixture.ts";

const candidates = [
  { id: "d", name: "Al Gore", party: "D" },
  { id: "r", name: "George W. Bush", party: "R" },
];

function sim(over: Partial<Simulation>): Simulation {
  return {
    year: 2000,
    system: "winner-take-all",
    bonus: {},
    popular: {},
    census: 1990,
    houseSize: 435,
    states: [],
    totals: { r: 271, d: 267 },
    totalElectoralVotes: 538,
    majority: 270,
    winner: "r",
    actualWinner: "r",
    ...over,
  };
}

describe("Overview", () => {
  it("marks changed outcomes and contingent elections", () => {
    const data = { elections: new Map([[2000, { candidates }]]) } as never;
    const columns = [
      { key: "a", label: "Real", rule: { kind: "historical" as const } },
      { key: "b", label: "Odd", rule: { kind: "wyoming" as const } },
    ];
    let picked = 0;
    render(
      <Overview
        data={data}
        rows={[{ year: 2000, sims: [sim({}), sim({ winner: null })] }]}
        columns={columns}
        selected={1900}
        onSelect={(y) => (picked = y)}
      />,
    );
    expect(screen.getByText("changed")).toBeTruthy();
    expect(screen.getByText("No majority").closest("td")!.textContent).toBe("No majority changed");
    fireEvent.click(screen.getByRole("button", { name: "2000" }));
    expect(picked).toBe(2000);
    const rows = [{ year: 2000, sims: [sim({}), sim({ winner: null })] }];
    expect(flippedYears(rows, 1)).toEqual([2000]);
    expect(flippedYears(rows, 0)).toEqual([]);
  });

  it("marks repeated winner names so phones can hide them", () => {
    const data = { elections: new Map([[2000, { candidates }]]) } as never;
    const columns = [
      { key: "a", label: "Real", rule: { kind: "historical" as const } },
      { key: "b", label: "Same", rule: { kind: "wyoming" as const } },
    ];
    const { container } = render(
      <Overview
        data={data}
        rows={[{ year: 2000, sims: [sim({}), sim({})] }]}
        columns={columns}
        selected={2000}
        onSelect={() => {}}
      />,
    );
    const names = [...container.querySelectorAll("td .who")].map((el) => el.className);
    expect(names).toEqual(["who", "who same"]);
  });
});

describe("methodRows and method cells", () => {
  it("runs every voting method on the real House", () => {
    const rows = methodRows(fixture, {
      rule: { kind: "cube-root" },
      method: "webster",
      allocation: "popular",
      system: "national",
      transfers: {},
    });
    expect(rows.map((r) => r.year)).toEqual([1992, 1996]);
    expect(rows[0]!.sims.map((s) => s.system)).toContain("ranked-choice");
    expect(rows[0]!.sims.every((s) => s.houseSize === 10)).toBe(true);
  });

  it("shows popular-vote shares and fractional electors, and can hide the note", () => {
    const data = { elections: new Map([[2000, { candidates }]]) } as never;
    const columns = [
      { key: "a", label: "Today" },
      { key: "b", label: "Popular" },
      { key: "c", label: "Fractional" },
    ];
    const { container } = render(
      <Overview
        data={data}
        rows={[
          {
            year: 2000,
            sims: [
              sim({}),
              sim({ system: "national", winner: "d", popular: { d: 51, r: 49 } }),
              sim({ system: "fractional", totals: { r: 259.24, d: 258.3 } }),
            ],
          },
        ]}
        columns={columns}
        selected={2000}
        onSelect={() => {}}
        note={false}
      />,
    );
    expect(screen.getByText("51.0%")).toBeTruthy();
    expect(screen.getByText("259.2")).toBeTruthy();
    expect(container.querySelector(".note")).toBeNull();
  });
});
