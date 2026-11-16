import type { SweepPoint } from "../engine/sweep.ts";
import type { Candidate } from "../engine/types.ts";
import { candidateColor, shortName } from "./colors.ts";

interface Props {
  points: readonly SweepPoint[];
  candidates: readonly Candidate[];
  /** Candidate whose electoral-vote share is plotted (the real-House winner). */
  focus: string | null;
  marks: readonly { size: number; label: string }[];
}

export interface Run {
  winner: string | null;
  from: number;
  to: number;
}

export function runsOf(points: readonly SweepPoint[]): Run[] {
  const runs: Run[] = [];
  for (const p of points) {
    const last = runs.at(-1);
    if (last && last.winner === p.winner) last.to = p.size;
    else runs.push({ winner: p.winner, from: p.size, to: p.size });
  }
  return runs;
}

/** Plain-language summary when the winner changes many times. */
export function describeRuns(runs: readonly Run[], candidates: readonly Candidate[]): string {
  const first = runs[0]!;
  const last = runs.at(-1)!;
  const counts = new Map<string | null, number>();
  for (const r of runs) counts.set(r.winner, (counts.get(r.winner) ?? 0) + r.to - r.from + 1);
  const tally = [...counts]
    .toSorted((a, b) => b[1] - a[1])
    .map(([w, n]) => `${shortName(candidates, w)} at ${n.toLocaleString()} sizes`)
    .join(", ");
  return (
    `${shortName(candidates, first.winner)} wins at every size up to ${first.to}; ` +
    `${shortName(candidates, last.winner)} wins at every size from ${last.from}. ` +
    `In between, the winner changes back and forth (${runs.length - 1} changes in all). ` +
    `Overall: ${tally}.`
  );
}

const MAX_RUNS = 6;
const W = 800;
const H = 300;
const PAD = { l: 44, r: 28, t: 12, b: 28 };

export function FlipChart({ points, candidates, focus, marks }: Props) {
  if (points.length < 2 || focus === null) return null;
  const minX = points[0]!.size;
  const maxX = points.at(-1)!.size;
  const shares = points.map((p) => (p.totals[focus] ?? 0) / p.totalElectoralVotes);
  const lo = Math.min(0.45, ...shares) - 0.01;
  const hi = Math.max(0.55, ...shares) + 0.01;
  const x = (size: number) => PAD.l + ((size - minX) / (maxX - minX)) * (W - PAD.l - PAD.r);
  const y = (share: number) => PAD.t + ((hi - share) / (hi - lo)) * (H - PAD.t - PAD.b);
  const line = points.map(
    (p, i) => `${i ? "L" : "M"}${x(p.size).toFixed(1)},${y(shares[i]!).toFixed(1)}`,
  );
  const runs = runsOf(points);
  const ticks = [lo + 0.01, 0.5, hi - 0.01].map((t) => Math.round(t * 100) / 100);
  const xTicks = [minX, 435, 1000, 1500, maxX].filter(
    (t, i, a) => t >= minX && t <= maxX && a.indexOf(t) === i,
  );
  return (
    <figure class="flip-chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Electoral vote share for ${shortName(candidates, focus)} by House size`}
      >
        {runs.map((r) => (
          <rect
            key={r.from}
            x={x(r.from)}
            y={PAD.t}
            width={Math.max(1, x(r.to) - x(r.from))}
            height={H - PAD.t - PAD.b}
            fill={candidateColor(candidates, r.winner)}
            class="band"
          />
        ))}
        {ticks.map((t) => (
          <g key={t} class="tick">
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} class={t === 0.5 ? "half" : ""} />
            <text x={PAD.l - 6} y={y(t) + 4} text-anchor="end">
              {Math.round(t * 100)}%
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={x(t)} y={H - 8} text-anchor="middle" class="xtick">
            {t}
          </text>
        ))}
        <path d={line.join("")} class="share" />
        {marks.map((m) => (
          <g key={m.label} class="mark">
            <line x1={x(m.size)} x2={x(m.size)} y1={PAD.t} y2={H - PAD.b} />
            <text x={x(m.size) + 4} y={PAD.t + 12}>
              {m.label}
            </text>
          </g>
        ))}
      </svg>
      <figcaption>
        Line: {shortName(candidates, focus)}'s share of electoral votes as the House grows from{" "}
        {minX} to {maxX} seats. Background: who wins at that size.
      </figcaption>
      {runs.length <= MAX_RUNS ? (
        <ol class="runs">
          {runs.map((r) => (
            <li key={r.from}>
              <b class="swatch" style={{ background: candidateColor(candidates, r.winner) }} />
              {r.from === r.to ? r.from : `${r.from}–${r.to}`} seats:{" "}
              {shortName(candidates, r.winner)}
            </li>
          ))}
        </ol>
      ) : (
        <p class="runs">{describeRuns(runs, candidates)}</p>
      )}
    </figure>
  );
}
