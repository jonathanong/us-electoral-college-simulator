import { Fragment } from "preact";
import { simulate } from "../engine/simulate.ts";
import type { Candidate, Dataset, Settings, Simulation } from "../engine/types.ts";
import { candidateColor, shortName } from "./colors.ts";
import { formatEv } from "./systems.ts";
import { TransferSliders, transferCandidates } from "./Transfers.tsx";
import { DEFAULT_STATE } from "./urlState.ts";

export interface GridRow {
  year: number;
  actual: Simulation;
  sim: Simulation;
}

/** What actually happened: the real House under today's winner-take-all system. */
export const ACTUAL: Settings = { ...DEFAULT_STATE.settings, rule: { kind: "historical" } };

export function gridRows(data: Dataset, settings: Settings): GridRow[] {
  return [...data.elections.keys()].map((year) => ({
    year,
    actual: simulate(data, year, ACTUAL),
    sim: simulate(data, year, settings),
  }));
}

/** The winner's electoral votes ("271 of 538"), or vote share under a national popular vote. */
export function resultText(sim: Simulation): string {
  if (sim.winner === null) return `nobody reaches ${sim.majority}`;
  if (sim.system === "national") {
    const total = Object.values(sim.popular).reduce((a, b) => a + b, 0);
    return `${((sim.popular[sim.winner]! / total) * 100).toFixed(1)}% of the vote`;
  }
  return `${formatEv(sim.totals[sim.winner]!)} of ${formatEv(sim.totalElectoralVotes)}`;
}

/** States whose winner ranked choice changes, compared with plurality under the same rules. */
export function rcvChanges(data: Dataset, sim: Simulation, settings: Settings): string[] {
  const plurality = simulate(data, sim.year, { ...settings, system: "winner-take-all" });
  const was = new Map(plurality.states.map((s) => [s.state, s.winner]));
  return sim.states.filter((s) => was.get(s.state) !== s.winner).map((s) => s.state);
}

function RcvEffect({ states }: { states: readonly string[] }) {
  return (
    <p class="transfer-effect">
      Where each eliminated candidate's voters go next.{" "}
      {states.length === 0
        ? "At these settings, no state's winner changes compared with plurality voting."
        : `Compared with plurality voting, the winner changes in ${states.join(", ")}.`}
    </p>
  );
}

function Winner({ sim, candidates }: { sim: Simulation; candidates: readonly Candidate[] }) {
  return (
    <>
      <b class="swatch" style={{ background: candidateColor(candidates, sim.winner) }} />
      <span class="who">
        {sim.winner === null ? "No majority" : shortName(candidates, sim.winner)}
      </span>{" "}
      <span class="num">{resultText(sim)}</span>
    </>
  );
}

interface Props {
  data: Dataset;
  rows: readonly GridRow[];
  settings: Settings;
  onSettings: (settings: Settings) => void;
  hrefFor: (year: number) => string;
}

export function Grid({ data, rows, settings, onSettings, hrefFor }: Props) {
  const rcv = settings.system === "ranked-choice";
  return (
    <div class="table-card">
      <div class="table-scroll">
        <table class="overview grid">
          <thead>
            <tr>
              <th scope="col">Election</th>
              <th scope="col">What happened</th>
              <th scope="col">With your rules</th>
            </tr>
          </thead>
          {rows.map(({ year, actual, sim }) => {
            const election = data.elections.get(year)!;
            const { candidates } = election;
            const changed = sim.winner !== actual.winner;
            const sliders = rcv && transferCandidates(election).length > 0;
            return (
              <tbody key={year} class={changed ? "changed" : undefined}>
                <tr>
                  <th scope="row">
                    <a href={hrefFor(year)}>{year}</a>
                  </th>
                  <td>
                    <Winner sim={actual} candidates={candidates} />
                  </td>
                  <td>
                    <Winner sim={sim} candidates={candidates} />
                    {changed && <span class="badge">changed</span>}
                  </td>
                </tr>
                {sliders && (
                  <tr class="sub">
                    <td colSpan={3}>
                      <RcvEffect states={rcvChanges(data, sim, settings)} />
                      <TransferSliders
                        election={election}
                        settings={settings}
                        onSettings={onSettings}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            );
          })}
        </table>
      </div>
    </div>
  );
}

interface ChangedProps {
  rows: readonly GridRow[];
  hrefFor: (year: number) => string;
}

/** "2 of 29 elections end differently: 2000, 2016." with each year linked. */
export function ChangedYears({ rows, hrefFor }: ChangedProps) {
  const years = rows.filter((r) => r.sim.winner !== r.actual.winner).map((r) => r.year);
  const total = rows.length;
  return (
    <p class="muted" aria-live="polite">
      {years.length === 0 ? (
        `No winner changes in any of the ${total} elections.`
      ) : (
        <>
          {years.length} of {total} elections end differently:{" "}
          {years.map((y, i) => (
            <Fragment key={y}>
              {i > 0 && ", "}
              <a href={hrefFor(y)}>{y}</a>
            </Fragment>
          ))}
          .
        </>
      )}
    </p>
  );
}
