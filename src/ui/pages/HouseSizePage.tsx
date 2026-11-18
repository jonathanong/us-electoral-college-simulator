import { useMemo } from "preact/hooks";
import type { PageProps } from "../App.tsx";
import { ruleLabel } from "../Controls.tsx";
import {
  Overview,
  PRESET_COLUMNS,
  type RuleColumn,
  flippedYears,
  overviewRows,
} from "../Overview.tsx";
import { Summary } from "../Summary.tsx";

export function HouseSizePage({ data, settings, href }: PageProps) {
  const columns = useMemo<RuleColumn[]>(() => {
    const preset = PRESET_COLUMNS.some((c) => c.key === settings.rule.kind);
    return preset
      ? [...PRESET_COLUMNS]
      : [...PRESET_COLUMNS, { key: "yours", label: ruleLabel(settings.rule), rule: settings.rule }];
  }, [settings.rule]);
  const rows = useMemo(() => overviewRows(data, settings, columns), [data, settings, columns]);
  return (
    <>
      <div class="page-head">
        <h1>What if the House had kept growing?</h1>
        <p class="lead">
          A state's electoral votes come from its House seats, and the House has been stuck at 435
          since 1913. Here is every election with a bigger House.
        </p>
      </div>
      <div class="card">
        <Summary
          data={data}
          columns={columns}
          flips={columns.map((_, i) => flippedYears(rows, i))}
        />
      </div>
      <Overview
        data={data}
        rows={rows}
        columns={columns}
        hrefFor={(year) => href({ page: "year", year })}
      />
      <article class="prose">
        <h2>Why 435?</h2>
        <p>
          In the Electoral College, each state gets one elector per House seat plus two for its
          senators. The House grew after almost every census until the 1911 Apportionment Act set it
          at 433 (435 once Arizona and New Mexico joined). After the 1920 census Congress never
          reapportioned, and the 1929 Act made 435 permanent. Every election since 1912 has been run
          on a 435-seat House (437 in 1960, after Alaska and Hawaii joined).
        </p>
        <h2>House size rules</h2>
        <dl>
          <dt>Cube root rule</dt>
          <dd>
            House size ≈ the cube root of the population, the pattern most national legislatures
            follow (692 seats after 2020).
          </dd>
          <dt>Wyoming rule</dt>
          <dd>Every district is about the size of the least populous state.</dd>
          <dt>People per representative</dt>
          <dd>A fixed ratio, like the Constitution's original floor of 30,000.</dd>
          <dt>Fixed / custom</dt>
          <dd>
            Pick one size, or a size after each census, in the rules on{" "}
            <a href={href({ page: "home" })}>all elections</a> or any election's page.
          </dd>
        </dl>
      </article>
    </>
  );
}
