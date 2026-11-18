import { useMemo, useState } from "preact/hooks";
import { simulate } from "../../engine/simulate.ts";
import { sweep } from "../../engine/sweep.ts";
import type { PageProps } from "../App.tsx";
import { Controls } from "../Controls.tsx";
import { FlipChart } from "../FlipChart.tsx";
import { ACTUAL } from "../Grid.tsx";
import { MethodControls } from "../MethodControls.tsx";
import { ResultBar } from "../ResultBar.tsx";
import { matchup } from "../routes.ts";
import { RulesPanel } from "../RulesPanel.tsx";
import { StateTable } from "../StateTable.tsx";
import { type MapMode, UsMap } from "../UsMap.tsx";

const SWEEP_MIN = 100;
const SWEEP_MAX = 2000;

export function YearPage({
  data,
  year,
  settings,
  onSettings,
  href,
  go,
}: PageProps & { year: number }) {
  const [mapMode, setMapMode] = useState<MapMode>("winner");
  const years = [...data.elections.keys()];
  const index = years.indexOf(year);
  const [prev, next] = [years[index - 1], years[index + 1]];
  const election = data.elections.get(year)!;
  const sim = useMemo(() => simulate(data, year, settings), [data, year, settings]);
  const real = useMemo(() => simulate(data, year, ACTUAL), [data, year]);
  const national = settings.system === "national";
  const points = useMemo(
    () =>
      national ? [] : sweep(data, year, { ...settings, minSize: SWEEP_MIN, maxSize: SWEEP_MAX }),
    [data, year, settings, national],
  );
  const marks = [{ size: 435, label: "435" }];
  if (sim.houseSize !== 435 && sim.houseSize >= SWEEP_MIN && sim.houseSize <= SWEEP_MAX) {
    marks.push({ size: sim.houseSize, label: `${sim.houseSize}` });
  }
  const modes: readonly [MapMode, string][] = [
    ["winner", "Winner & electors"],
    ["change", "Change vs real House"],
  ];

  return (
    <>
      <div class="page-head">
        <nav class="crumbs" aria-label="Breadcrumb">
          <a href={href({ page: "home" })}>All elections</a> <span aria-hidden="true">/</span>{" "}
          <span aria-current="page">{year}</span>
        </nav>
        <h1>The {year} election</h1>
        <p class="lead">{matchup(data, year)}: what if it had been run with different rules?</p>
        <nav class="pager" aria-label="Other elections">
          {prev && <a href={href({ page: "year", year: prev })}>← {prev}</a>}
          {next && <a href={href({ page: "year", year: next })}>{next} →</a>}
        </nav>
      </div>
      <section class="workspace">
        <RulesPanel>
          <Controls
            years={years}
            year={year}
            onYear={(y) => go({ page: "year", year: y })}
            settings={settings}
            onSettings={onSettings}
          />
          <MethodControls election={election} settings={settings} onSettings={onSettings} />
        </RulesPanel>
        <div class="workspace-main">
          <div class="card">
            <ResultBar sim={sim} actual={real} candidates={election.candidates} />
          </div>
          <div class="card">
            <div class="card-head">
              <h2 class="card-title">Map</h2>
              <div class="tabs" role="group" aria-label="Map shows">
                {modes.map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={mapMode === mode}
                    onClick={() => setMapMode(mode)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <UsMap sim={sim} actual={real} candidates={election.candidates} mode={mapMode} />
            <StateTable sim={sim} candidates={election.candidates} />
          </div>
          {!national && (
            <div class="card" id="flips">
              <h2 class="card-title">Flip finder</h2>
              <p class="muted">
                Every House size from {SWEEP_MIN} to {SWEEP_MAX}, with the rest of your rules.
              </p>
              <FlipChart
                points={points}
                candidates={election.candidates}
                focus={real.winner}
                marks={marks}
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
