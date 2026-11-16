import type { Candidate } from "../engine/types.ts";

/** CSS custom properties defined in styles.css, so light and dark themes both work. */
const PARTY_COLORS: Readonly<Record<string, string>> = {
  D: "var(--dem)",
  R: "var(--rep)",
  Progressive: "var(--prog)",
  Dixiecrat: "var(--dixie)",
  "States' Rights": "var(--dixie)",
  AIP: "var(--aip)",
  "American Independent": "var(--aip)",
  Unpledged: "var(--unpledged)",
};

const FALLBACKS = ["var(--other1)", "var(--other2)", "var(--other3)"];

export function partyColor(party: string | undefined, index = 0): string {
  return (party && PARTY_COLORS[party]) || FALLBACKS[index % FALLBACKS.length]!;
}

export function candidateColor(candidates: readonly Candidate[], id: string | null): string {
  if (id === null) return "var(--muted)";
  const index = candidates.findIndex((c) => c.id === id);
  return partyColor(candidates[index]?.party, Math.max(index, 0));
}

const PARTICLES = new Set(["La", "Van", "De", "Du", "Von"]);

/** Surname-ish short label, e.g. "Theodore Roosevelt" -> "Roosevelt". */
export function shortName(candidates: readonly Candidate[], id: string | null): string {
  if (id === null) return "No majority";
  const name = candidates.find((c) => c.id === id)?.name ?? id;
  const words = name.replace(/,? (Jr\.?|Sr\.?|II|III)$/, "").split(" ");
  const last = words.at(-1)!;
  const before = words.at(-2);
  return before && PARTICLES.has(before) ? `${before} ${last}` : last;
}

export function fullName(candidates: readonly Candidate[], id: string): string {
  return candidates.find((c) => c.id === id)?.name ?? id;
}
