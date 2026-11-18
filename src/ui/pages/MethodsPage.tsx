import { Fragment } from "preact";
import { useMemo } from "preact/hooks";
import type { PageProps } from "../App.tsx";
import { METHOD_COLUMNS, Overview, flippedYears, methodRows } from "../Overview.tsx";
import { Summary } from "../Summary.tsx";
import { SYSTEM_INFO } from "../systems.ts";

export function MethodsPage({ data, settings, href }: PageProps) {
  const rows = useMemo(() => methodRows(data, settings), [data, settings.transfers]);
  return (
    <>
      <div class="page-head">
        <h1>What if we voted differently?</h1>
        <p class="lead">
          Every election under real proposals to change how electors are awarded, with the real
          House. Open an election to see its map, or pick a method in its rules.
        </p>
      </div>
      <div class="card">
        <Summary
          data={data}
          columns={METHOD_COLUMNS}
          flips={METHOD_COLUMNS.map((_, i) => flippedYears(rows, i))}
        />
      </div>
      <Overview
        data={data}
        rows={rows}
        columns={METHOD_COLUMNS}
        hrefFor={(year) => href({ page: "year", year })}
        note={false}
      />
      <article class="prose">
        <h2>The methods</h2>
        <dl class="methods">
          {Object.entries(SYSTEM_INFO).map(([id, info]) => (
            <div key={id}>
              <dt>{info.label}</dt>
              <dd>
                {info.summary}
                {info.refs.map((r) => (
                  <Fragment key={r.href}>
                    {" "}
                    <a href={r.href} rel="noopener">
                      {r.text}
                    </a>
                    .
                  </Fragment>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </article>
    </>
  );
}
