import { censusFor } from "../engine/house.ts";
import { CensusSizes } from "./CensusSizes.tsx";
import type { Allocation, HouseRule, Method, Settings } from "../engine/types.ts";

export const RULE_LABELS: Readonly<Record<HouseRule["kind"], string>> = {
  historical: "Real House (435 since 1913)",
  "cube-root": "Cube root rule",
  wyoming: "Wyoming rule",
  fixed: "Fixed size",
  ratio: "People per representative",
  custom: "Custom size per census",
};

export function ruleLabel(rule: HouseRule): string {
  if (rule.kind === "fixed") return `${rule.size} seats`;
  if (rule.kind === "ratio") return `1 seat per ${rule.perRep.toLocaleString("en-US")}`;
  return RULE_LABELS[rule.kind];
}

const METHOD_LABELS: Readonly<Record<Method, string>> = {
  "huntington-hill": "Huntington–Hill (current law)",
  webster: "Webster",
  jefferson: "Jefferson",
  hamilton: "Hamilton",
};

function defaultRule(kind: HouseRule["kind"], current: HouseRule): HouseRule {
  switch (kind) {
    case "fixed":
      return { kind, size: 600 };
    case "ratio":
      return { kind, perRep: 500_000 };
    case "custom":
      return { kind, sizes: current.kind === "custom" ? current.sizes : {} };
    default:
      return { kind };
  }
}

interface Props {
  /** The election picker; the all-elections grid has none. */
  years?: readonly number[];
  year?: number;
  onYear?: (year: number) => void;
  /** Link to the all-elections grid, where every census size can be set. */
  homeHref?: string;
  settings: Settings;
  onSettings: (settings: Settings) => void;
}

const num = (e: Event) => Number((e.currentTarget as HTMLInputElement).value);

export function Controls({ years, year, onYear, homeHref, settings, onSettings }: Props) {
  const { rule, system } = settings;
  // A national popular vote ignores the House; only winner-take-all plans use the elector split.
  const house = system !== "national";
  const split = system === "winner-take-all" || system === "bonus";
  const setRule = (next: HouseRule) => onSettings({ ...settings, rule: next });
  return (
    <form class="field-group" onSubmit={(e) => e.preventDefault()}>
      {years && onYear && (
        <label class="field">
          <span class="field-label">Election</span>
          <select value={year} onChange={(e) => onYear(num(e))}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      )}
      {house && (
        <label class="field">
          <span class="field-label">House size</span>
          <select
            value={rule.kind}
            onChange={(e) =>
              setRule(
                defaultRule(
                  (e.currentTarget as HTMLSelectElement).value as HouseRule["kind"],
                  rule,
                ),
              )
            }
          >
            {Object.entries(RULE_LABELS).map(([kind, label]) => (
              <option key={kind} value={kind}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}
      {house && rule.kind === "fixed" && (
        <label class="field">
          <span class="field-label">
            Seats <output>{rule.size}</output>
          </span>
          <input
            type="range"
            min={100}
            max={2000}
            step={1}
            value={rule.size}
            onInput={(e) => setRule({ kind: "fixed", size: num(e) })}
          />
        </label>
      )}
      {house && rule.kind === "ratio" && (
        <label class="field">
          <span class="field-label">People per seat</span>
          <input
            type="number"
            min={30000}
            step={10000}
            value={rule.perRep}
            onChange={(e) => setRule({ kind: "ratio", perRep: Math.max(30_000, num(e) || 30_000) })}
          />
        </label>
      )}
      {house && (
        <label class="field">
          <span class="field-label">Apportionment method</span>
          <select
            value={settings.method}
            onChange={(e) =>
              onSettings({
                ...settings,
                method: (e.currentTarget as HTMLSelectElement).value as Method,
              })
            }
          >
            {Object.entries(METHOD_LABELS).map(([m, label]) => (
              <option key={m} value={m}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}
      {split && (
        <label class="field">
          <span class="field-label">Split states</span>
          <select
            value={settings.allocation}
            onChange={(e) =>
              onSettings({
                ...settings,
                allocation: (e.currentTarget as HTMLSelectElement).value as Allocation,
              })
            }
          >
            <option value="electors">Scale historical elector split</option>
            <option value="popular">Popular-vote winner takes all</option>
          </select>
        </label>
      )}
      {house && rule.kind === "custom" && (
        <CensusSizes
          rule={rule}
          onRule={setRule}
          only={
            year && homeHref
              ? { census: censusFor(year, rule), year, allHref: homeHref }
              : undefined
          }
        />
      )}
    </form>
  );
}
