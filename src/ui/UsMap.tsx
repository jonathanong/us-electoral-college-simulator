import { geoPath } from "d3-geo";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import polylabel from "polylabel";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import atlas from "us-atlas/states-albers-10m.json";
import { CODE_BY_FIPS, stateName } from "../data/states.ts";
import type { Candidate, Simulation } from "../engine/types.ts";
import { candidateColor, shortName } from "./colors.ts";

const topology = atlas as unknown as Topology<{ states: GeometryCollection }>;
const path = geoPath();

/**
 * Label anchor: the point deepest inside the state's largest polygon, so numbers sit visually
 * centred even in curved or multi-part states (Florida, Louisiana, Michigan, Hawaii).
 */
export function labelPoint(f: Feature<Polygon | MultiPolygon>): [number, number] {
  const polygons =
    f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const largest = polygons.reduce((best, rings) =>
    path.area({ type: "Polygon", coordinates: rings }) >
    path.area({ type: "Polygon", coordinates: best })
      ? rings
      : best,
  );
  const [x, y] = polylabel(largest as [number, number][][], 0.5);
  return [x, y];
}

const BORDERS = path(mesh(topology, topology.objects.states, (a, b) => a !== b))!;

/** Hand-placed label offsets for states too small to hold a number. */
const CALLOUTS: Readonly<Record<string, readonly [number, number]>> = {
  VT: [-10, -40],
  NH: [35, -10],
  MA: [55, 0],
  RI: [50, 15],
  CT: [45, 30],
  NJ: [40, 10],
  DE: [40, 10],
  MD: [55, 25],
  DC: [50, 45],
};

const SHAPES = feature(topology, topology.objects.states).features.map((f) => {
  const code = CODE_BY_FIPS.get(String(f.id))!;
  return {
    code,
    d: path(f)!,
    // Callout offsets are tuned from the centroid, so keep it for those small states.
    centroid:
      code in CALLOUTS ? path.centroid(f) : labelPoint(f as Feature<Polygon | MultiPolygon>),
  };
});

export type MapMode = "winner" | "change";

interface Props {
  sim: Simulation;
  candidates: readonly Candidate[];
  mode: MapMode;
}

function changeColor(delta: number): string {
  if (delta === 0) return "var(--surface-2)";
  const t = Math.min(1, Math.abs(delta) / 20);
  const tone = delta > 0 ? "var(--grow)" : "var(--shrink)";
  return `color-mix(in oklab, ${tone} ${Math.round(25 + 75 * t)}%, var(--surface-2))`;
}

export function UsMap({ sim, candidates, mode }: Props) {
  const byCode = new Map(sim.states.map((s) => [s.state, s]));
  return (
    <svg class="map" viewBox="0 0 975 610" role="img" aria-label={`Map of ${sim.year} results`}>
      {SHAPES.map(({ code, d }) => {
        const s = byCode.get(code);
        const delta = s ? s.electoralVotes - s.actualElectoralVotes : 0;
        const fill = !s
          ? "var(--surface-2)"
          : mode === "winner"
            ? candidateColor(candidates, s.winner)
            : changeColor(delta);
        const label = s
          ? `${stateName(code)}: ${s.electoralVotes} electoral votes (actual ${s.actualElectoralVotes}), ${shortName(candidates, s.winner)}`
          : `${stateName(code)}: not a state in ${sim.year}`;
        return (
          <path key={code} d={d} fill={fill} class={s ? "state" : "state absent"} data-state={code}>
            <title>{label}</title>
          </path>
        );
      })}
      <path d={BORDERS} class="borders" />
      {SHAPES.map(({ code, centroid }) => {
        const s = byCode.get(code);
        if (!s) return null;
        const [dx, dy] = CALLOUTS[code] ?? [0, 0];
        const [x, y] = [centroid[0] + dx, centroid[1] + dy];
        const delta = s.electoralVotes - s.actualElectoralVotes;
        const text =
          mode === "winner" ? String(s.electoralVotes) : delta > 0 ? `+${delta}` : String(delta);
        return (
          <g key={code} class={mode === "winner" ? "label on-fill" : "label"} aria-hidden="true">
            {(dx !== 0 || dy !== 0) && (
              <line x1={centroid[0]} y1={centroid[1]} x2={x - 4} y2={y} class="callout" />
            )}
            <text x={x} y={y} class={dx !== 0 || dy !== 0 ? "outside" : undefined}>
              {text}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
