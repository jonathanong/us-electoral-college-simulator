import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import type { Simulation } from "../../src/engine/types.ts";
import { Overview, flippedYears } from "../../src/ui/Overview.tsx";

const candidates = [
  { id: "d", name: "Al Gore", party: "D" },
  { id: "r", name: "George W. Bush", party: "R" },
];

function sim(over: Partial<Simulation>): Simulation {
  return {
    year: 2000,
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
    expect(screen.getByText("—")).toBeTruthy();
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
