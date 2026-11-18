import type { Candidate, Simulation } from "../engine/types.ts";
import { candidateColor, fullName, shortName } from "./colors.ts";
import { formatEv } from "./systems.ts";

interface Props {
  sim: Simulation;
  actual: Simulation;
  candidates: readonly Candidate[];
}

function verdict(sim: Simulation, actual: Simulation, candidates: readonly Candidate[]): string {
  const name = (id: string | null) => (id === null ? "nobody" : fullName(candidates, id));
  if (sim.winner === actual.winner) return `Same outcome: ${name(sim.winner)} still wins.`;
  if (sim.winner === null) {
    return `Different outcome: nobody reaches ${sim.majority}, so the House would pick the president.`;
  }
  return `Different outcome: ${name(sim.winner)} wins instead of ${name(actual.winner)}.`;
}

function meta(sim: Simulation, actual: Simulation, candidates: readonly Candidate[]): string {
  if (sim.system === "national") {
    const votes = Object.values(sim.popular).reduce((a, b) => a + b, 0);
    return `${votes.toLocaleString("en-US")} votes nationwide · House size doesn't matter`;
  }
  const bonus = Object.entries(sim.bonus)
    .map(([id, n]) => ` (including ${n} bonus for ${shortName(candidates, id)})`)
    .join("");
  const need =
    sim.system === "fractional" ? "most wins" : `${sim.majority.toLocaleString()} to win`;
  return `House of ${sim.houseSize.toLocaleString()} (real: ${actual.houseSize}) · ${sim.totalElectoralVotes.toLocaleString()} electoral votes${bonus} · ${need} · ${sim.census} census`;
}

export function ResultBar({ sim, actual, candidates }: Props) {
  const national = sim.system === "national";
  const tally = national ? sim.popular : sim.totals;
  const sum = Object.values(tally).reduce((a, b) => a + b, 0);
  const rows = Object.entries(tally).toSorted((a, b) => b[1] - a[1]);
  const shown = (n: number) => (national ? `${((n / sum) * 100).toFixed(1)}%` : formatEv(n));
  const flipped = sim.winner !== actual.winner;
  return (
    <section class="result" aria-live="polite">
      <p class={flipped ? "verdict flipped" : "verdict"}>{verdict(sim, actual, candidates)}</p>
      <div
        class="bar"
        role="img"
        aria-label={national ? "Popular vote shares" : "Electoral vote totals"}
      >
        {rows.map(([id, n]) => (
          <span
            key={id}
            style={{ flexGrow: n, background: candidateColor(candidates, id) }}
            title={`${fullName(candidates, id)}: ${shown(n)}`}
          />
        ))}
        {!national && sim.system !== "fractional" && (
          <i
            class="majority-line"
            style={{ left: `${(sim.majority / sim.totalElectoralVotes) * 100}%` }}
          />
        )}
      </div>
      <ul class="totals">
        {rows.map(([id, n]) => (
          <li key={id}>
            <b class="swatch" style={{ background: candidateColor(candidates, id) }} />
            <span class="who">{shortName(candidates, id)}</span>
            <span class="num">{shown(n)}</span>
            <span class="was">actual electors: {actual.totals[id] ?? 0}</span>
          </li>
        ))}
      </ul>
      <p class="meta">{meta(sim, actual, candidates)}</p>
    </section>
  );
}
