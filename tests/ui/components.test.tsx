import { render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import type { Simulation } from "../../src/engine/types.ts";
import { About } from "../../src/ui/About.tsx";
import { FlipChart, runsOf } from "../../src/ui/FlipChart.tsx";
import { ResultBar } from "../../src/ui/ResultBar.tsx";
import { Summary } from "../../src/ui/Summary.tsx";
import { UsMap } from "../../src/ui/UsMap.tsx";

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

describe("ResultBar", () => {
  it("describes same, changed and contingent outcomes", () => {
    const { rerender } = render(
      <ResultBar sim={sim({})} actual={sim({})} candidates={candidates} />,
    );
    expect(screen.getByText(/Same outcome: George W. Bush still wins/)).toBeTruthy();
    rerender(
      <ResultBar
        sim={sim({ winner: "d", totals: { d: 300, x: 1 } })}
        actual={sim({})}
        candidates={candidates}
      />,
    );
    expect(screen.getByText(/Al Gore wins instead of George W. Bush/)).toBeTruthy();
    expect(screen.getByText("real House: 0")).toBeTruthy();
    rerender(<ResultBar sim={sim({ winner: null })} actual={sim({})} candidates={candidates} />);
    expect(screen.getByText(/the House would pick/)).toBeTruthy();
    rerender(<ResultBar sim={sim({})} actual={sim({ winner: null })} candidates={candidates} />);
    expect(screen.getByText(/George W. Bush wins instead of nobody/)).toBeTruthy();
  });
});

describe("FlipChart", () => {
  const point = (size: number, winner: string | null) => ({
    size,
    winner,
    totals: { r: size % 7, d: 10 - (size % 7) },
    totalElectoralVotes: 10,
  });

  it("draws bands, marks and runs", () => {
    const points = [point(100, "r"), point(101, "r"), point(102, "d"), point(103, null)];
    const noFocus = { ...point(104, "x"), totals: { x: 10 } };
    expect(runsOf(points)).toEqual([
      { winner: "r", from: 100, to: 101 },
      { winner: "d", from: 102, to: 102 },
      { winner: null, from: 103, to: 103 },
    ]);
    const { container } = render(
      <FlipChart
        points={[...points, noFocus]}
        candidates={candidates}
        focus="r"
        marks={[{ size: 101, label: "you" }]}
      />,
    );
    expect(container.querySelectorAll(".band")).toHaveLength(4);
    expect(screen.getByText("100–101 seats: Bush")).toBeTruthy();
    expect(screen.getByText("you")).toBeTruthy();
  });

  it("summarises long alternations and renders nothing without data", () => {
    const points = Array.from({ length: 20 }, (_, i) => point(500 + i, i % 2 ? "d" : "r"));
    render(<FlipChart points={points} candidates={candidates} focus="d" marks={[]} />);
    expect(
      screen.getByText(
        "Bush wins at every size up to 500; Gore wins at every size from 519. In between, the winner changes back and forth (19 changes in all). Overall: Bush at 10 sizes, Gore at 10 sizes.",
      ),
    ).toBeTruthy();
    const { container } = render(
      <FlipChart points={points.slice(0, 1)} candidates={candidates} focus="d" marks={[]} />,
    );
    expect(container.innerHTML).toBe("");
    const none = render(
      <FlipChart points={points} candidates={candidates} focus={null} marks={[]} />,
    );
    expect(none.container.innerHTML).toBe("");
  });
});

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
      <UsMap sim={sim({ states })} candidates={candidates} mode="winner" />,
    );
    expect(container.querySelector('[data-state="TX"]')!.getAttribute("fill")).toBe("var(--rep)");
    expect(container.querySelector('[data-state="NY"]')!.getAttribute("class")).toBe(
      "state absent",
    );
    expect(screen.getByText("42")).toBeTruthy();
    expect(container.querySelectorAll(".callout")).toHaveLength(1);
    rerender(<UsMap sim={sim({ states })} candidates={candidates} mode="change" />);
    expect(screen.getByText("+2")).toBeTruthy();
    expect(screen.getByText("-5")).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy();
  });
});

describe("Summary and About", () => {
  it("summarises flips per column", () => {
    const data = {
      elections: new Map([
        [2000, {}],
        [2004, {}],
      ]),
    } as never;
    const columns = [
      { key: "a", label: "Real", rule: { kind: "historical" as const } },
      { key: "b", label: "Cube", rule: { kind: "cube-root" as const } },
      { key: "c", label: "Wyo", rule: { kind: "wyoming" as const } },
    ];
    render(<Summary data={data} columns={columns} flips={[[], [2000], []]} />);
    expect(
      screen.getByText(/1 of 2 elections would have had a different outcome \(2000\)/),
    ).toBeTruthy();
    expect(screen.getByText(/no change in any of the 2 elections/)).toBeTruthy();
  });

  it("links references and the repo", () => {
    render(<About />);
    const links = screen.getAllByRole("link");
    expect(links.some((a) => a.getAttribute("href")!.includes("github.com"))).toBe(true);
  });
});
