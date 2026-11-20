import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { dataset } from "../../src/data/index.ts";
import { simulate } from "../../src/engine/simulate.ts";
import { Grid } from "../../src/ui/Grid.tsx";
import { rcvChanges, shareText } from "../../src/ui/Transfers.tsx";
import { DEFAULT_STATE } from "../../src/ui/urlState.ts";

const rcv = { ...DEFAULT_STATE.settings, system: "ranked-choice" as const };

describe("ranked-choice sliders", () => {
  it("formats vote shares", () => {
    expect(shareText(232, 1000)).toBe("23.2%");
    expect(shareText(1, 10_000)).toBe("<0.1%");
  });

  it("says when no state changes", () => {
    const sim = simulate(dataset, 2016, rcv);
    expect(rcvChanges(dataset, sim, rcv)).toEqual([]);
    const row = { year: 2016, actual: sim, sim };
    render(
      <Grid data={dataset} rows={[row]} settings={rcv} onSettings={() => {}} hrefFor={String} />,
    );
    expect(screen.getByText(/no state's winner changes/)).toBeTruthy();
  });

  it("names third-party voters, their share, and the states their next choices move", () => {
    const settings = { ...rcv, transfers: { "1912.taft": 0 } };
    const sim = simulate(dataset, 1912, settings);
    const changes = rcvChanges(dataset, sim, settings);
    expect(changes.length).toBeGreaterThan(0);
    render(
      <Grid
        data={dataset}
        rows={[{ year: 1912, actual: sim, sim }]}
        settings={settings}
        onSettings={() => {}}
        hrefFor={() => ""}
      />,
    );
    expect(
      screen.getByText(
        `Compared with plurality voting, the winner changes in ${changes.join(", ")}.`,
        { exact: false },
      ),
    ).toBeTruthy();
    const taft = screen.getByText(/^Taft's voters/).closest("label")!;
    expect(taft.textContent).toMatch(/Taft's voters · 2\d\.\d% of the vote/);
    expect(taft.textContent).toMatch(/Wilson 0%.*Roosevelt 100%/);
  });
});
