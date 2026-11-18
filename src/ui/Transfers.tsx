import { OTHER, frontRunners, nationalPopular } from "../engine/national.ts";
import { EVEN_SPLIT } from "../engine/rcv.ts";
import type { Election, Settings } from "../engine/types.ts";
import { shortName } from "./colors.ts";

/** Candidates whose voters' next choices matter: everyone but the two national front-runners. */
export function transferCandidates(election: Election): string[] {
  const popular = nationalPopular(election);
  const [first, second] = frontRunners(popular);
  return Object.keys(popular)
    .filter((id) => id !== first && id !== second)
    .toSorted((a, b) => (a === OTHER ? 1 : b === OTHER ? -1 : popular[b]! - popular[a]!));
}

interface Props {
  election: Election;
  settings: Settings;
  onSettings: (settings: Settings) => void;
}

/** One slider per eliminated candidate: the share of their voters who rank the leader next. */
export function TransferSliders({ election, settings, onSettings }: Props) {
  const { candidates, year } = election;
  const [first, second] = frontRunners(nationalPopular(election));
  const name = (id: string) => shortName(candidates, id);
  return (
    <div class="transfers">
      {transferCandidates(election).map((id) => {
        const key = `${year}.${id}`;
        const pct = settings.transfers[key] ?? EVEN_SPLIT * 100;
        return (
          <label key={key} class="transfer">
            <span class="transfer-head">
              <span>{name(id)} voters</span>
              <span class="transfer-split">
                {name(first)} <output>{pct}%</output> · {name(second)} <output>{100 - pct}%</output>
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={pct}
              aria-label={`${year}: share of ${name(id)} voters ranking ${name(first)} next`}
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
    </div>
  );
}
