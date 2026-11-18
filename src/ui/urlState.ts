import { LAST_YEAR } from "../engine/house.ts";
import type { Allocation, HouseRule, Method, Settings, VotingSystem } from "../engine/types.ts";

export interface ViewState {
  year: number;
  settings: Settings;
}

export const DEFAULT_STATE: ViewState = {
  year: LAST_YEAR,
  settings: {
    rule: { kind: "cube-root" },
    method: "huntington-hill",
    allocation: "electors",
    system: "winner-take-all",
    transfers: {},
  },
};

const METHODS: readonly Method[] = ["huntington-hill", "webster", "jefferson", "hamilton"];
const ALLOCATIONS: readonly Allocation[] = ["electors", "popular"];
export const SYSTEMS: readonly VotingSystem[] = [
  "winner-take-all",
  "national",
  "proportional",
  "fractional",
  "district",
  "bonus",
  "ranked-choice",
];

/** "1992.perot:60,2000.nader:70" -> percentages, clamped to 0-100. */
function parseTransfers(value: string | null): Record<string, number> {
  const out: Record<string, number> = {};
  for (const pair of (value ?? "").split(",")) {
    const [key, pct] = pair.split(":");
    const n = Number(pct);
    if (key && /^\d{4}\.[a-z]+$/.test(key) && pct && Number.isFinite(n)) {
      out[key] = Math.min(100, Math.max(0, Math.round(n)));
    }
  }
  return out;
}

function positiveInt(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/** Same bounds as the controls, so a shared URL cannot request an enormous House. */
export const LIMITS = { minSize: 48, maxSize: 5000, minPerRep: 30_000 } as const;

const clampSize = (n: number) => Math.min(LIMITS.maxSize, Math.max(LIMITS.minSize, n));

function parseRule(params: URLSearchParams): HouseRule {
  switch (params.get("rule")) {
    case "historical":
      return { kind: "historical" };
    case "wyoming":
      return { kind: "wyoming" };
    case "fixed":
      return { kind: "fixed", size: clampSize(positiveInt(params.get("size"), 435)) };
    case "ratio":
      return {
        kind: "ratio",
        perRep: Math.max(LIMITS.minPerRep, positiveInt(params.get("perRep"), 500_000)),
      };
    case "custom": {
      const sizes: Record<number, number> = {};
      for (const pair of (params.get("sizes") ?? "").split(",")) {
        const [census, size] = pair.split(":").map(Number);
        if (Number.isInteger(census) && Number.isInteger(size) && size! > 0)
          sizes[census!] = clampSize(size!);
      }
      return { kind: "custom", sizes };
    }
    default:
      return { kind: "cube-root" };
  }
}

export function parseState(search: string, years: readonly number[]): ViewState {
  const params = new URLSearchParams(search);
  const year = Number(params.get("year"));
  const method = params.get("method") as Method;
  const allocation = params.get("alloc") as Allocation;
  const system = params.get("system") as VotingSystem;
  return {
    year: years.includes(year) ? year : DEFAULT_STATE.year,
    settings: {
      rule: parseRule(params),
      method: METHODS.includes(method) ? method : DEFAULT_STATE.settings.method,
      allocation: ALLOCATIONS.includes(allocation) ? allocation : DEFAULT_STATE.settings.allocation,
      system: SYSTEMS.includes(system) ? system : DEFAULT_STATE.settings.system,
      transfers: parseTransfers(params.get("rcv")),
    },
  };
}

/** Query string for non-default settings ("" when everything is default). */
export function serializeSettings(settings: Settings): string {
  const params = new URLSearchParams();
  const { rule } = settings;
  if (rule.kind !== DEFAULT_STATE.settings.rule.kind) params.set("rule", rule.kind);
  if (rule.kind === "fixed") params.set("size", String(rule.size));
  if (rule.kind === "ratio") params.set("perRep", String(rule.perRep));
  if (rule.kind === "custom") {
    const pairs = Object.entries(rule.sizes).map(([c, s]) => `${c}:${s}`);
    params.set("sizes", pairs.join(","));
  }
  if (settings.method !== DEFAULT_STATE.settings.method) params.set("method", settings.method);
  if (settings.allocation !== DEFAULT_STATE.settings.allocation) {
    params.set("alloc", settings.allocation);
  }
  if (settings.system !== DEFAULT_STATE.settings.system) params.set("system", settings.system);
  const transfers = Object.entries(settings.transfers).map(([k, v]) => `${k}:${v}`);
  if (transfers.length > 0) params.set("rcv", transfers.join(","));
  const query = params.toString();
  return query ? `?${query}` : "";
}
