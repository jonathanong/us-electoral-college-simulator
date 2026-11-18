import { stateName } from "../data/states.ts";
import type { Candidate, Simulation } from "../engine/types.ts";
import { candidateColor, shortName } from "./colors.ts";
import { formatEv } from "./systems.ts";

interface Props {
  sim: Simulation;
  candidates: readonly Candidate[];
}

export function StateTable({ sim, candidates }: Props) {
  const rows = sim.states.toSorted((a, b) => stateName(a.state).localeCompare(stateName(b.state)));
  const stateCount = rows.filter((s) => s.state !== "DC").length;
  const hasDc = stateCount < rows.length;
  return (
    <details class="state-table">
      <summary>
        All {stateCount} states{hasDc ? " and DC" : ""}: seats and electoral votes
      </summary>
      <div class="table-card table-scroll">
        <table class="overview">
          <thead>
            <tr>
              <th scope="col">State</th>
              <th scope="col">Seats</th>
              <th scope="col">Electors (real)</th>
              <th scope="col">Electors here</th>
              <th scope="col">Goes to</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.state}>
                <th scope="row">{stateName(s.state)}</th>
                <td class="num">{s.state === "DC" ? "—" : s.seats}</td>
                <td class="num">{s.actualElectoralVotes}</td>
                <td class="num">{s.electoralVotes}</td>
                <td>
                  {Object.entries(s.allocation)
                    .toSorted((a, b) => b[1] - a[1])
                    .map(([id, n]) => (
                      <span key={id} class="alloc">
                        <b class="swatch" style={{ background: candidateColor(candidates, id) }} />
                        {shortName(candidates, id)} {formatEv(n)}
                      </span>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
