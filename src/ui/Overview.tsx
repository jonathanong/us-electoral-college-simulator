import type { Dataset, HouseRule, Settings, Simulation } from "../engine/types.ts";
import { simulate } from "../engine/simulate.ts";
import { candidateColor, shortName } from "./colors.ts";
import { SYSTEMS } from "./urlState.ts";
import { SYSTEM_INFO, formatEv } from "./systems.ts";

export interface Column {
  key: string;
  label: string;
}

export interface RuleColumn extends Column {
  rule: HouseRule;
}

export const PRESET_COLUMNS: readonly RuleColumn[] = [
  { key: "historical", label: "Real House", rule: { kind: "historical" } },
  { key: "cube-root", label: "Cube root", rule: { kind: "cube-root" } },
  { key: "wyoming", label: "Wyoming rule", rule: { kind: "wyoming" } },
];

export type Rows = { year: number; sims: Simulation[] }[];

export function overviewRows(
  data: Dataset,
  settings: Settings,
  columns: readonly RuleColumn[],
): Rows {
  return [...data.elections.keys()].map((year) => ({
    year,
    sims: columns.map((c) => simulate(data, year, { ...settings, rule: c.rule })),
  }));
}

export const METHOD_COLUMNS: readonly Column[] = SYSTEMS.map((s) => ({
  key: s,
  label: SYSTEM_INFO[s].short,
}));

/** Every election under each voting method, with the real House and the chosen transfers. */
export function methodRows(data: Dataset, settings: Settings): Rows {
  return [...data.elections.keys()].map((year) => ({
    year,
    sims: SYSTEMS.map((system) =>
      simulate(data, year, {
        ...settings,
        rule: { kind: "historical" },
        allocation: "electors",
        system,
      }),
    ),
  }));
}

/** The winner's electoral votes, or popular-vote share under a national popular vote. */
function score(sim: Simulation): string {
  if (sim.winner === null) return "";
  if (sim.system === "national") {
    const total = Object.values(sim.popular).reduce((a, b) => a + b, 0);
    return `${((sim.popular[sim.winner]! / total) * 100).toFixed(1)}%`;
  }
  return formatEv(sim.totals[sim.winner]!);
}

interface Props {
  data: Dataset;
  rows: readonly { year: number; sims: readonly Simulation[] }[];
  columns: readonly Column[];
  /** Link to an election's page. */
  hrefFor: (year: number) => string;
  /** Footnote on pledged vs cast electors (shown once per page). */
  note?: boolean;
}

export function flippedYears(rows: Props["rows"], column: number): number[] {
  return rows.filter((r) => r.sims[column]!.winner !== r.sims[0]!.winner).map((r) => r.year);
}

export function Overview({ data, rows, columns, hrefFor, note = true }: Props) {
  return (
    <div class="table-card">
      <div class="table-scroll">
        <table class="overview">
          <thead>
            <tr>
              <th scope="col">Year</th>
              {columns.map((c) => (
                <th key={c.key} scope="col">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ year, sims }) => {
              const candidates = data.elections.get(year)!.candidates;
              return (
                <tr key={year}>
                  <th scope="row">
                    <a href={hrefFor(year)}>{year}</a>
                  </th>
                  {sims.map((sim, i) => {
                    const flipped = i > 0 && sim.winner !== sims[0]!.winner;
                    return (
                      <td key={columns[i]!.key} class={flipped ? "flipped" : undefined}>
                        <b
                          class="swatch"
                          style={{ background: candidateColor(candidates, sim.winner) }}
                        />
                        {/* On phones only changed winners repeat the name, so the table fits. */}
                        <span class={i > 0 && !flipped ? "who same" : "who"}>
                          {shortName(candidates, sim.winner)}
                        </span>{" "}
                        <span class="num">
                          {score(sim)}
                          {sim.system !== "national" && sim.winner !== null && (
                            <span class="of">/{sim.totalElectoralVotes}</span>
                          )}
                        </span>
                        {flipped && <span class="badge">changed</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {note && (
        <p class="note">
          Electoral votes count faithless electors for the candidate they were pledged to (for
          example Trump 306 in 2016, though 304 were cast).
        </p>
      )}
    </div>
  );
}
