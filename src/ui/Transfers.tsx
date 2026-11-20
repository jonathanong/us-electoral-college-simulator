import { OTHER, frontRunners, nationalPopular } from "../engine/national.ts";
import { EVEN_SPLIT } from "../engine/rcv.ts";
import { simulate } from "../engine/simulate.ts";
import type { Dataset, Election, Settings, Simulation } from "../engine/types.ts";
import { candidateColor, shortName } from "./colors.ts";

/** Candidates whose voters' next choices matter: everyone but the two national front-runners. */
export function transferCandidates(election: Election): string[] {
  const popular = nationalPopular(election);
  const [first, second] = frontRunners(popular);
  return Object.keys(popular)
    .filter((id) => id !== first && id !== second)
    .toSorted((a, b) => (a === OTHER ? 1 : b === OTHER ? -1 : popular[b]! - popular[a]!));
}

/** "23.2%", or "<0.1%" for a sliver. */
export function shareText(votes: number, total: number): string {
  const pct = (votes / total) * 100;
  return pct < 0.1 ? "<0.1%" : `${pct.toFixed(1)}%`;
}

/** States whose winner ranked choice changes, compared with plurality under the same rules. */
export function rcvChanges(data: Dataset, sim: Simulation, settings: Settings): string[] {
  const plurality = simulate(data, sim.year, { ...settings, system: "winner-take-all" });
  const was = new Map(plurality.states.map((s) => [s.state, s.winner]));
  return sim.states.filter((s) => was.get(s.state) !== s.winner).map((s) => s.state);
}

/** Which states ranked choice changes; `lead` first says what the sliders below do. */
export function RcvEffect({ states, lead }: { states: readonly string[]; lead?: boolean }) {
  return (
    <p class="transfer-effect">
      {lead && "Where each eliminated candidate's voters go next. "}
      {states.length === 0
        ? "At these settings, no state's winner changes compared with plurality voting."
        : `Compared with plurality voting, the winner changes in ${states.join(", ")}.`}
    </p>
  );
}

interface Props {
  election: Election;
  settings: Settings;
  onSettings: (settings: Settings) => void;
}

/**
 * One slider per eliminated candidate, from all to the leader (left) to all to the runner-up
 * (right). The setting stores the leader's share.
 */
export function TransferSliders({ election, settings, onSettings }: Props) {
  const { candidates, year } = election;
  const popular = nationalPopular(election);
  const total = Object.values(popular).reduce((a, b) => a + b, 0);
  const [first, second] = frontRunners(popular);
  const name = (id: string) => shortName(candidates, id);
  const end = (id: string, pct: number) => (
    <span class="transfer-end">
      <b class="swatch" style={{ background: candidateColor(candidates, id) }} />
      {name(id)} <output>{pct}%</output>
    </span>
  );
  return (
    <div class="transfers">
      {transferCandidates(election).map((id) => {
        const key = `${year}.${id}`;
        const pct = settings.transfers[key] ?? EVEN_SPLIT * 100;
        const who = id === OTHER ? "Others'" : `${name(id)}'s`;
        return (
          <label key={key} class="transfer">
            <span class="transfer-head">
              {who} voters <span class="muted">· {shareText(popular[id]!, total)} of the vote</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={100 - pct}
              aria-label={`${year}: share of ${who} voters ranking ${name(second)} over ${name(first)}`}
              aria-valuetext={`${name(first)} ${pct}%, ${name(second)} ${100 - pct}%`}
              onInput={(e) =>
                onSettings({
                  ...settings,
                  transfers: {
                    ...settings.transfers,
                    [key]: 100 - Number((e.currentTarget as HTMLInputElement).value),
                  },
                })
              }
            />
            <span class="transfer-ends">
              {end(first, pct)}
              {end(second, 100 - pct)}
            </span>
          </label>
        );
      })}
    </div>
  );
}
