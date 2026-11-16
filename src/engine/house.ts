import type { HouseRule, StateCode } from "./types.ts";

export const FIRST_YEAR = 1912;
export const LAST_YEAR = 2024;
export const CAPPED_SIZE = 435;

/**
 * Census whose apportionment governs an election. Historically the 1920 census was never used, so
 * 1912–1928 ran on the 1910 apportionment; any counterfactual rule reapportions after 1920 too.
 */
export function censusFor(year: number, rule: HouseRule): number {
  if (rule.kind === "historical" && year <= 1928) return 1910;
  return Math.floor((year - 2) / 10) * 10;
}

/** House size a rule produces for a census, never fewer than one seat per state. */
export function houseSize(
  rule: Exclude<HouseRule, { kind: "historical" }>,
  census: number,
  pops: ReadonlyMap<StateCode, number>,
): number {
  const values = [...pops.values()];
  const total = values.reduce((a, b) => a + b, 0);
  let size: number;
  switch (rule.kind) {
    case "fixed":
      size = rule.size;
      break;
    case "cube-root":
      size = Math.cbrt(total);
      break;
    case "wyoming":
      size = total / Math.min(...values);
      break;
    case "ratio":
      size = total / rule.perRep;
      break;
    case "custom":
      size = rule.sizes[census] ?? CAPPED_SIZE;
      break;
  }
  return Math.max(pops.size, Math.round(size));
}

export function majorityOf(total: number): number {
  return Math.floor(total / 2) + 1;
}
