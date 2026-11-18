import { useEffect, useMemo, useState } from "preact/hooks";
import { simulate } from "../engine/simulate.ts";
import { sweep } from "../engine/sweep.ts";
import type { Dataset } from "../engine/types.ts";
import { About, REPO_URL } from "./About.tsx";
import { Controls, ruleLabel } from "./Controls.tsx";
import { FlipChart } from "./FlipChart.tsx";
import { MethodControls } from "./MethodControls.tsx";
import {
  METHOD_COLUMNS,
  Overview,
  PRESET_COLUMNS,
  type RuleColumn,
  flippedYears,
  methodRows,
  overviewRows,
} from "./Overview.tsx";
import { ResultBar } from "./ResultBar.tsx";
import { StateTable } from "./StateTable.tsx";
import { Summary } from "./Summary.tsx";
import { type MapMode, UsMap } from "./UsMap.tsx";
import { parseState, serializeState, type ViewState } from "./urlState.ts";

const SWEEP_MIN = 100;
const SWEEP_MAX = 2000;

/** `search` overrides the page URL; the build passes "" to prerender the default view. */
export function App({ data, search }: { data: Dataset; search?: string }) {
  const years = useMemo(() => [...data.elections.keys()], [data]);
  const [view, setView] = useState<ViewState>(() => parseState(search ?? location.search, years));
  const [mapMode, setMapMode] = useState<MapMode>("winner");
  const { year, settings } = view;

  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }, []);

  useEffect(() => {
    history.replaceState(null, "", serializeState(view) + location.hash);
  }, [view]);

  const columns = useMemo<RuleColumn[]>(() => {
    const preset = PRESET_COLUMNS.some((c) => c.key === settings.rule.kind);
    return preset
      ? [...PRESET_COLUMNS]
      : [...PRESET_COLUMNS, { key: "yours", label: ruleLabel(settings.rule), rule: settings.rule }];
  }, [settings.rule]);
  const rows = useMemo(() => overviewRows(data, settings, columns), [data, settings, columns]);
  const byMethod = useMemo(() => methodRows(data, settings), [data, settings.transfers]);

  const election = data.elections.get(year)!;
  const sim = useMemo(() => simulate(data, year, settings), [data, year, settings]);
  // What actually happened: the real House under today's winner-take-all system.
  const real = useMemo(
    () =>
      simulate(data, year, {
        ...settings,
        rule: { kind: "historical" },
        system: "winner-take-all",
      }),
    [data, year, settings],
  );
  const points = useMemo(
    () => sweep(data, year, { ...settings, minSize: SWEEP_MIN, maxSize: SWEEP_MAX }),
    [data, year, settings],
  );
  const marks = [{ size: 435, label: "435" }];
  if (sim.houseSize !== 435 && sim.houseSize >= SWEEP_MIN && sim.houseSize <= SWEEP_MAX) {
    marks.push({ size: sim.houseSize, label: `${sim.houseSize}` });
  }

  const selectYear = (y: number) => {
    setView({ ...view, year: y });
    document.getElementById("explore")!.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <header class="masthead">
        <p class="kicker">The House has had 435 seats since 1913</p>
        <h1>What if the House had kept growing?</h1>
        <p class="dek">
          A state's Electoral College votes come from its House seats. Replay every presidential
          election since 1912 with a bigger House and see whether the winner changes.
        </p>
        <nav>
          <a href="#answer">Answer</a> <a href="#methods">Voting methods</a>{" "}
          <a href="#explore">Explore</a> <a href="#flips">Flip finder</a>{" "}
          <a href="#about">Method</a>{" "}
          <a href={REPO_URL} class="gh">
            GitHub
          </a>
        </nav>
      </header>
      <main>
        <section id="answer">
          <h2>The short answer</h2>
          <Summary
            data={data}
            columns={columns}
            flips={columns.map((_, i) => flippedYears(rows, i))}
          />
          <Overview
            data={data}
            rows={rows}
            columns={columns}
            selected={year}
            onSelect={selectYear}
          />
        </section>
        <section id="methods">
          <h2>What if we voted differently?</h2>
          <p>
            Every election under real proposals to change how electors are awarded, with the real
            House. Pick one under Explore to see its map and sources.
          </p>
          <Summary
            data={data}
            columns={METHOD_COLUMNS}
            flips={METHOD_COLUMNS.map((_, i) => flippedYears(byMethod, i))}
          />
          <Overview
            data={data}
            rows={byMethod}
            columns={METHOD_COLUMNS}
            selected={year}
            onSelect={selectYear}
            note={false}
          />
        </section>
        <section id="explore">
          <h2>Explore {year}</h2>
          <Controls
            years={years}
            year={year}
            settings={settings}
            onYear={(y) => setView({ ...view, year: y })}
            onSettings={(s) => setView({ ...view, settings: s })}
          />
          <MethodControls
            election={election}
            settings={settings}
            onSettings={(s) => setView({ ...view, settings: s })}
          />
          <ResultBar sim={sim} actual={real} candidates={election.candidates} />
          <div class="map-head">
            <div class="seg" role="group" aria-label="Map shows">
              <button
                type="button"
                aria-pressed={mapMode === "winner"}
                onClick={() => setMapMode("winner")}
              >
                Winner &amp; electors
              </button>
              <button
                type="button"
                aria-pressed={mapMode === "change"}
                onClick={() => setMapMode("change")}
              >
                Change vs real House
              </button>
            </div>
          </div>
          <UsMap sim={sim} candidates={election.candidates} mode={mapMode} />
          <StateTable sim={sim} candidates={election.candidates} />
        </section>
        {settings.system !== "national" && (
          <section id="flips">
            <h2>Flip finder: {year}</h2>
            <p>
              Every House size from {SWEEP_MIN} to {SWEEP_MAX}, using the voting method,
              apportionment method and split-state option above.
            </p>
            <FlipChart
              points={points}
              candidates={election.candidates}
              focus={real.winner}
              marks={marks}
            />
          </section>
        )}
        <About />
      </main>
      <footer>
        <a href={REPO_URL}>Source on GitHub</a> · Code MIT · Data CC BY-SA 4.0 (see{" "}
        <a href={`${REPO_URL}/blob/main/data/SOURCES.md`}>sources</a>)
      </footer>
    </>
  );
}
