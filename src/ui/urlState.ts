import { LAST_YEAR } from "../engine/house.ts";
import type { Allocation, HouseRule, Method, Settings } from "../engine/types.ts";

export interface ViewState {
  year: number;
  settings: Settings;
}

export const DEFAULT_STATE: ViewState = {
  year: LAST_YEAR,
  settings: { rule: { kind: "cube-root" }, method: "huntington-hill", allocation: "electors" },
};

const METHODS: readonly Method[] = ["huntington-hill", "webster", "jefferson", "hamilton"];
const ALLOCATIONS: readonly Allocation[] = ["electors", "popular"];

function positiveInt(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function parseRule(params: URLSearchParams): HouseRule {
  switch (params.get("rule")) {
    case "historical":
      return { kind: "historical" };
    case "wyoming":
      return { kind: "wyoming" };
    case "fixed":
      return { kind: "fixed", size: positiveInt(params.get("size"), 435) };
    case "ratio":
      return { kind: "ratio", perRep: positiveInt(params.get("perRep"), 500_000) };
    case "custom": {
      const sizes: Record<number, number> = {};
      for (const pair of (params.get("sizes") ?? "").split(",")) {
        const [census, size] = pair.split(":").map(Number);
        if (Number.isInteger(census) && Number.isInteger(size) && size! > 0) sizes[census!] = size!;
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
  return {
    year: years.includes(year) ? year : DEFAULT_STATE.year,
    settings: {
      rule: parseRule(params),
      method: METHODS.includes(method) ? method : DEFAULT_STATE.settings.method,
      allocation: ALLOCATIONS.includes(allocation) ? allocation : DEFAULT_STATE.settings.allocation,
    },
  };
}

export function serializeState({ year, settings }: ViewState): string {
  const params = new URLSearchParams({ year: String(year), rule: settings.rule.kind });
  const { rule } = settings;
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
  return `?${params}`;
}
