import type { Candidate, Simulation } from "../engine/types.ts";
import { candidateColor, fullName, shortName } from "./colors.ts";

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

export function ResultBar({ sim, actual, candidates }: Props) {
  const rows = Object.entries(sim.totals).toSorted((a, b) => b[1] - a[1]);
  const flipped = sim.winner !== actual.winner;
  return (
    <section class="result" aria-live="polite">
      <p class={flipped ? "verdict flipped" : "verdict"}>{verdict(sim, actual, candidates)}</p>
      <div class="bar" role="img" aria-label="Electoral vote totals">
        {rows.map(([id, n]) => (
          <span
            key={id}
            style={{ flexGrow: n, background: candidateColor(candidates, id) }}
            title={`${fullName(candidates, id)}: ${n}`}
          />
        ))}
        <i
          class="majority-line"
          style={{ left: `${(sim.majority / sim.totalElectoralVotes) * 100}%` }}
        />
      </div>
      <ul class="totals">
        {rows.map(([id, n]) => (
          <li key={id}>
            <b class="swatch" style={{ background: candidateColor(candidates, id) }} />
            <span class="who">{shortName(candidates, id)}</span>
            <span class="num">{n}</span>
            <span class="was">real House: {actual.totals[id] ?? 0}</span>
          </li>
        ))}
      </ul>
      <p class="meta">
        House of <b>{sim.houseSize.toLocaleString()}</b> (real: {actual.houseSize}) ·{" "}
        {sim.totalElectoralVotes.toLocaleString()} electors · {sim.majority.toLocaleString()} to win
        · {sim.census} census
      </p>
    </section>
  );
}
