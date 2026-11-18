import { useMemo } from "preact/hooks";
import type { PageProps } from "../App.tsx";
import { Controls } from "../Controls.tsx";
import { ChangedYears, Grid, gridRows } from "../Grid.tsx";
import { MethodControls } from "../MethodControls.tsx";
import { RulesPanel } from "../RulesPanel.tsx";

const GUIDES = [
  {
    page: "house-size",
    title: "What if the House had kept growing?",
    text: "The House has had 435 seats since 1913. Compare the cube root and Wyoming rules.",
  },
  {
    page: "voting-methods",
    title: "What if we voted differently?",
    text: "The national popular vote, proportional electors, ranked choice and other real proposals.",
  },
  {
    page: "about",
    title: "How it works",
    text: "Where the data comes from, every assumption, and the sources behind each method.",
  },
] as const;

export function HomePage({ data, settings, onSettings, href }: PageProps) {
  const rows = useMemo(() => gridRows(data, settings), [data, settings]);
  const yearHref = (year: number) => href({ page: "year", year });
  return (
    <>
      <div class="hero">
        <h1>What if presidents were elected differently?</h1>
        <p class="lead">
          Replay every U.S. presidential election from {rows[0]!.year} to {rows.at(-1)!.year} with a
          bigger House of Representatives or a different way of awarding electors, and see which
          winners change.
        </p>
      </div>
      <div class="guides">
        {GUIDES.map((g) => (
          <a key={g.page} class="card guide" href={href({ page: g.page })}>
            <h2>{g.title}</h2>
            <p>{g.text}</p>
          </a>
        ))}
      </div>
      <section class="workspace" aria-labelledby="grid-title">
        <RulesPanel>
          <Controls settings={settings} onSettings={onSettings} />
          <MethodControls settings={settings} onSettings={onSettings} />
        </RulesPanel>
        <div class="workspace-main">
          <div class="section-head">
            <h2 id="grid-title">Every election with your rules</h2>
            <ChangedYears rows={rows} hrefFor={yearHref} />
          </div>
          <Grid
            data={data}
            rows={rows}
            settings={settings}
            onSettings={onSettings}
            hrefFor={yearHref}
          />
        </div>
      </section>
    </>
  );
}
