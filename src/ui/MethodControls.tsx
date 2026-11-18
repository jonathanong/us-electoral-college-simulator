import { OTHER, frontRunners, nationalPopular } from "../engine/national.ts";
import { EVEN_SPLIT } from "../engine/rcv.ts";
import type { Election, Settings, VotingSystem } from "../engine/types.ts";
import { shortName } from "./colors.ts";
import { SYSTEM_INFO } from "./systems.ts";

interface Props {
  election: Election;
  settings: Settings;
  onSettings: (settings: Settings) => void;
}

/** Candidates whose voters' next choices matter: everyone but the two national front-runners. */
export function transferCandidates(election: Election): string[] {
  const popular = nationalPopular(election);
  const [first, second] = frontRunners(popular);
  return Object.keys(popular)
    .filter((id) => id !== first && id !== second)
    .toSorted((a, b) => (a === OTHER ? 1 : b === OTHER ? -1 : popular[b]! - popular[a]!));
}

export function MethodControls({ election, settings, onSettings }: Props) {
  const { candidates, year } = election;
  const popular = nationalPopular(election);
  const [first, second] = frontRunners(popular);
  const name = (id: string) => shortName(candidates, id);
  return (
    <div class="controls method-controls">
      <label class="wide">
        Voting method
        <select
          value={settings.system}
          onChange={(e) =>
            onSettings({
              ...settings,
              system: (e.currentTarget as HTMLSelectElement).value as VotingSystem,
            })
          }
        >
          {Object.entries(SYSTEM_INFO).map(([id, info]) => (
            <option key={id} value={id}>
              {info.label}
            </option>
          ))}
        </select>
      </label>
      <p class="method-summary">{SYSTEM_INFO[settings.system].summary}</p>
      {settings.system === "ranked-choice" && (
        <fieldset class="transfers">
          <legend>Where eliminated candidates' voters go next</legend>
          {transferCandidates(election).map((id) => {
            const key = `${year}.${id}`;
            const pct = settings.transfers[key] ?? EVEN_SPLIT * 100;
            return (
              <label key={key} class="wide">
                {name(id)} voters: {name(first)} <output>{pct}%</output> · {name(second)}{" "}
                <output>{100 - pct}%</output>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={pct}
                  aria-label={`Share of ${name(id)} voters ranking ${name(first)} next`}
                  onInput={(e) =>
                    onSettings({
                      ...settings,
                      transfers: {
                        ...settings.transfers,
                        [key]: Number((e.currentTarget as HTMLInputElement).value),
                      },
                    })
                  }
                />
              </label>
            );
          })}
        </fieldset>
      )}
    </div>
  );
}
