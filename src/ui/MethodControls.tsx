import type { Election, Settings, VotingSystem } from "../engine/types.ts";
import { SYSTEM_INFO } from "./systems.ts";
import { RcvEffect, TransferSliders } from "./Transfers.tsx";

interface Props {
  /** The election whose ranked-choice sliders to show; the all-elections grid shows them per row. */
  election?: Election;
  /** States ranked choice changes in that election, compared with plurality voting. */
  changes?: readonly string[];
  settings: Settings;
  onSettings: (settings: Settings) => void;
}

export function MethodControls({ election, changes = [], settings, onSettings }: Props) {
  const rcv = settings.system === "ranked-choice";
  return (
    <div class="field-group">
      <label class="field">
        <span class="field-label">Voting method</span>
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
      <p class="field-hint">{SYSTEM_INFO[settings.system].summary}</p>
      {rcv && election && (
        <fieldset class="field">
          <legend class="field-label">Where eliminated candidates' voters go next</legend>
          <RcvEffect states={changes} />
          <TransferSliders election={election} settings={settings} onSettings={onSettings} />
        </fieldset>
      )}
      {rcv && !election && (
        <p class="field-hint">Set where third-party voters go in each election's row.</p>
      )}
    </div>
  );
}
