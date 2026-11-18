import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import type { Simulation } from "../../src/engine/types.ts";
import { ChangedYears, Grid, resultText } from "../../src/ui/Grid.tsx";
import { DEFAULT_STATE } from "../../src/ui/urlState.ts";

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

describe("Grid", () => {
  it("describes each result", () => {
    expect(resultText(sim({}))).toBe("271 of 538");
    expect(resultText(sim({ winner: null }))).toBe("nobody reaches 270");
    expect(resultText(sim({ system: "national", popular: { r: 48, d: 52 } }))).toBe(
      "48.0% of the vote",
    );
  });

  it("marks a contingent election as changed, with no sliders when nobody else ran", () => {
    const election = { year: 2000, candidates, states: new Map() };
    const data = { elections: new Map([[2000, election]]) } as never;
    const { container } = render(
      <Grid
        data={data}
        rows={[{ year: 2000, actual: sim({}), sim: sim({ winner: null }) }]}
        settings={{ ...DEFAULT_STATE.settings, system: "ranked-choice" }}
        onSettings={() => {}}
        hrefFor={() => ""}
      />,
    );
    expect(screen.getByText("No majority")).toBeTruthy();
    expect(screen.getByText("changed")).toBeTruthy();
    expect(container.querySelector("tr.sub")).toBeNull();
  });

  it("lists changed years", () => {
    const row = (year: number, winner: string) => ({ year, actual: sim({}), sim: sim({ winner }) });
    const rows = [row(1996, "r"), row(2000, "d"), row(2016, "d")];
    render(<ChangedYears rows={rows} hrefFor={(y) => `/e/${y}/`} />);
    expect(screen.getByText(/2 of 3 elections end differently/).textContent).toBe(
      "2 of 3 elections end differently: 2000, 2016.",
    );
    expect(screen.getByRole("link", { name: "2016" }).getAttribute("href")).toBe("/e/2016/");
  });
});
