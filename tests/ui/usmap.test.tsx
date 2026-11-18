import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import type { Simulation } from "../../src/engine/types.ts";
import { MapNotes, shares } from "../../src/ui/MapFills.tsx";
import { UsMap } from "../../src/ui/UsMap.tsx";
import { candidates, sim } from "./sim.ts";

describe("UsMap", () => {
  const states: Simulation["states"] = [
    {
      state: "TX",
      seats: 40,
      electoralVotes: 42,
      actualElectoralVotes: 40,
      allocation: { r: 42 },
      winner: "r",
    },
    {
      state: "VT",
      seats: 1,
      electoralVotes: 3,
      actualElectoralVotes: 3,
      allocation: { d: 3 },
      winner: "d",
    },
    {
      state: "CA",
      seats: 50,
      electoralVotes: 50,
      actualElectoralVotes: 55,
      allocation: { d: 50 },
      winner: "d",
    },
  ];

  it("labels electoral votes or changes", () => {
    const { container, rerender } = render(
      <UsMap
        sim={sim({ states })}
        actual={sim({ states })}
        candidates={candidates}
        mode="winner"
      />,
    );
    expect(container.querySelector('[data-state="TX"]')!.getAttribute("fill")).toBe("var(--rep)");
    expect(container.querySelector('[data-state="NY"]')!.getAttribute("class")).toBe(
      "state absent",
    );
    expect(screen.getByText("42")).toBeTruthy();
    expect(container.querySelectorAll(".callout")).toHaveLength(1);
    rerender(
      <UsMap
        sim={sim({ states })}
        actual={sim({ states })}
        candidates={candidates}
        mode="change"
      />,
    );
    expect(screen.getByText("+2")).toBeTruthy();
    expect(screen.getByText("-5")).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("stripes states whose electors went to someone else in reality", () => {
    const real = states.map((s) => (s.state === "TX" ? { ...s, winner: "d" } : s));
    const { container } = render(
      <UsMap
        sim={sim({ states })}
        actual={sim({ states: real })}
        candidates={candidates}
        mode="winner"
      />,
    );
    const flipped = container.querySelectorAll(".flipped");
    expect(flipped).toHaveLength(1);
    expect(flipped[0]!.getAttribute("fill")).toBe("url(#stripes-d)");
    expect(container.querySelector("#stripes-d rect")!.getAttribute("fill")).toBe("var(--dem)");
    expect(container.querySelector('[data-state="TX"] title')!.textContent).toMatch(
      /really won by /,
    );
    expect(screen.getByText(/1 striped state gives most of its/)).toBeTruthy();
  });

  it("bands states that split their electors", () => {
    const split = states.map((s) =>
      s.state === "CA" ? { ...s, allocation: { r: 20, d: 30, other: 0 } } : s,
    );
    const { container } = render(
      <UsMap
        sim={sim({ states: split })}
        actual={sim({ states })}
        candidates={candidates}
        mode="winner"
      />,
    );
    expect(container.querySelector('[data-state="CA"]')!.getAttribute("fill")).toBe(
      "url(#split-CA)",
    );
    const stops = [...container.querySelectorAll("#split-CA stop")].map((x) => [
      x.getAttribute("offset"),
      x.getAttribute("stop-color"),
    ]);
    expect(stops).toEqual([
      ["0", "var(--dem)"],
      ["0.6", "var(--dem)"],
      ["0.6", "var(--rep)"],
      ["1", "var(--rep)"],
    ]);
    expect(container.querySelector('[data-state="CA"] title')!.textContent).toMatch(
      /Gore 30, Bush 20$/,
    );
    expect(screen.getByText(/1 state splits its electors/)).toBeTruthy();
  });
});

describe("map keys", () => {
  it("puts the winner first in a tie and pluralises the notes", () => {
    const tie = {
      state: "VT",
      seats: 1,
      electoralVotes: 4,
      actualElectoralVotes: 3,
      allocation: { r: 2, d: 2 },
      winner: "d",
    };
    expect(shares(tie).map(([id]) => id)).toEqual(["d", "r"]);
    render(<MapNotes splits={2} flips={2} />);
    expect(screen.getByText(/2 states split their electors/)).toBeTruthy();
    expect(screen.getByText(/2 striped states give most of their/)).toBeTruthy();
  });
});
