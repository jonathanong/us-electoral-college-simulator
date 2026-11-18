import type { Candidate, StateOutcome } from "../engine/types.ts";
import { candidateColor, shortName } from "./colors.ts";

/** Each candidate's electors in a state, largest share first (the winner leads ties). */
export function shares(s: StateOutcome): [string, number][] {
  return Object.entries(s.allocation)
    .filter(([, n]) => n > 0)
    .toSorted(([a, x], [b, y]) => y - x || Number(b === s.winner) - Number(a === s.winner));
}

/** "Clinton 30, Bush 20" for a state's tooltip. */
export function describeShares(candidates: readonly Candidate[], s: StateOutcome): string {
  return shares(s)
    .map(([id, n]) => `${shortName(candidates, id)} ${n}`)
    .join(", ");
}

export const stripesId = (winner: string) => `stripes-${winner.replace(/\W/g, "_")}`;
export const splitId = (code: string) => `split-${code}`;

export interface Split {
  code: string;
  parts: [string, number][];
}

interface DefsProps {
  candidates: readonly Candidate[];
  /** Real winners to draw stripes for. */
  striped: readonly string[];
  splits: readonly Split[];
}

/** Stripe patterns in each real winner's color, and left-to-right bands for split states. */
export function MapDefs({ candidates, striped, splits }: DefsProps) {
  return (
    <defs>
      {striped.map((winner) => (
        <pattern
          key={winner}
          id={stripesId(winner)}
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="3.5" height="8" fill={candidateColor(candidates, winner)} />
        </pattern>
      ))}
      {splits.map(({ code, parts }) => {
        const total = parts.reduce((sum, [, n]) => sum + n, 0);
        let at = 0;
        return (
          <linearGradient key={code} id={splitId(code)}>
            {parts.flatMap(([id, n]) => {
              const color = candidateColor(candidates, id);
              const from = at;
              at += n / total;
              return [
                <stop key={`${id}-from`} offset={from} stop-color={color} />,
                <stop key={`${id}-to`} offset={at} stop-color={color} />,
              ];
            })}
          </linearGradient>
        );
      })}
    </defs>
  );
}

/** Keys for the bands and stripes, shown only when the map has them. */
export function MapNotes({ splits, flips }: { splits: number; flips: number }) {
  return (
    <>
      {splits > 0 && (
        <p class="map-note">
          <span class="swatch split" aria-hidden="true" />
          {splits === 1 ? "1 state splits its" : `${splits} states split their`} electors; each
          band's width is that candidate's share.
        </p>
      )}
      {flips > 0 && (
        <p class="map-note">
          <span class="swatch striped" aria-hidden="true" />
          {flips === 1
            ? "1 striped state gives most of its"
            : `${flips} striped states give most of their`}{" "}
          electors to a different candidate than in reality; the stripes show who really won.
        </p>
      )}
    </>
  );
}
