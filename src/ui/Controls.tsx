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

const CENSUSES = [1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

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
  years: readonly number[];
  year: number;
  settings: Settings;
  onYear: (year: number) => void;
  onSettings: (settings: Settings) => void;
}

const num = (e: Event) => Number((e.currentTarget as HTMLInputElement).value);

export function Controls({ years, year, settings, onYear, onSettings }: Props) {
  const { rule, system } = settings;
  // A national popular vote ignores the House; only winner-take-all plans use the elector split.
  const house = system !== "national";
  const split = system === "winner-take-all" || system === "bonus";
  const setRule = (next: HouseRule) => onSettings({ ...settings, rule: next });
  return (
    <form class="controls" onSubmit={(e) => e.preventDefault()}>
      <label>
        Election
        <select value={year} onChange={(e) => onYear(num(e))}>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
      {house && (
        <label>
          House size
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
        <label class="wide">
          Seats: <output>{rule.size}</output>
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
        <label>
          People per seat
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
        <label>
          Apportionment method
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
        <label>
          Split states
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
        <fieldset class="census-sizes">
          <legend>Seats after each census (blank = 435)</legend>
          {CENSUSES.map((census) => (
            <label key={census}>
              {census}
              <input
                type="number"
                min={48}
                max={5000}
                placeholder="435"
                value={rule.sizes[census] ?? ""}
                onChange={(e) => {
                  const sizes: Record<number, number> = { ...rule.sizes };
                  const n = num(e);
                  if (n >= 48) sizes[census] = Math.min(5000, Math.round(n));
                  else delete sizes[census];
                  setRule({ kind: "custom", sizes });
                }}
              />
            </label>
          ))}
        </fieldset>
      )}
    </form>
  );
}
