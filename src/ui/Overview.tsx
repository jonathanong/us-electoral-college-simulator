import type { Dataset, HouseRule, Settings, Simulation } from "../engine/types.ts";
import { simulate } from "../engine/simulate.ts";
import { candidateColor, shortName } from "./colors.ts";

export interface Column {
  key: string;
  label: string;
  rule: HouseRule;
}

export const PRESET_COLUMNS: readonly Column[] = [
  { key: "historical", label: "Real House", rule: { kind: "historical" } },
  { key: "cube-root", label: "Cube root", rule: { kind: "cube-root" } },
  { key: "wyoming", label: "Wyoming rule", rule: { kind: "wyoming" } },
];

export function overviewRows(
  data: Dataset,
  settings: Settings,
  columns: readonly Column[],
): { year: number; sims: Simulation[] }[] {
  return [...data.elections.keys()].map((year) => ({
    year,
    sims: columns.map((c) => simulate(data, year, { ...settings, rule: c.rule })),
  }));
}

interface Props {
  data: Dataset;
  rows: readonly { year: number; sims: readonly Simulation[] }[];
  columns: readonly Column[];
  selected: number;
  onSelect: (year: number) => void;
}

export function flippedYears(rows: Props["rows"], column: number): number[] {
  return rows.filter((r) => r.sims[column]!.winner !== r.sims[0]!.winner).map((r) => r.year);
}

export function Overview({ data, rows, columns, selected, onSelect }: Props) {
  return (
    <div class="overview-wrap">
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
              <tr key={year} class={year === selected ? "selected" : undefined}>
                <th scope="row">
                  <button
                    type="button"
                    onClick={() => onSelect(year)}
                    aria-pressed={year === selected}
                  >
                    {year}
                  </button>
                </th>
                {sims.map((sim, i) => {
                  const flipped = i > 0 && sim.winner !== sims[0]!.winner;
                  const ev = sim.winner === null ? 0 : sim.totals[sim.winner]!;
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
                        {sim.winner === null ? "—" : ev}
                        <span class="of">/{sim.totalElectoralVotes}</span>
                      </span>
                      {flipped && <span class="flag">changed</span>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p class="note">
        Electoral votes count faithless electors for the candidate they were pledged to (for example
        Trump 306 in 2016, though 304 were cast).
      </p>
    </div>
  );
}
