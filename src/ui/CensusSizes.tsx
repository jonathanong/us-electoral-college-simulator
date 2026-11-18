import type { HouseRule } from "../engine/types.ts";

const CENSUSES = [1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

interface Props {
  rule: Extract<HouseRule, { kind: "custom" }>;
  onRule: (rule: HouseRule) => void;
  /** On an election's page, the one census that election used. */
  only?: { census: number; year: number; allHref: string };
}

/** House size after each census; an election's page shows only the census it used. */
export function CensusSizes({ rule, onRule, only }: Props) {
  const censuses = only ? [only.census] : CENSUSES;
  return (
    <fieldset class="field census-sizes">
      <legend class="field-label">
        {only ? `Seats after the ${only.census} census` : "Seats after each census"}
      </legend>
      {censuses.map((census) => (
        <label key={census}>
          {census}
          <input
            type="number"
            min={48}
            max={5000}
            placeholder="435"
            value={rule.sizes[census] ?? ""}
            onChange={(e) => {
              const sizes: Record<number, number> = { ...rule.sizes };
              const n = Number((e.currentTarget as HTMLInputElement).value);
              if (n >= 48) sizes[census] = Math.min(5000, Math.round(n));
              else delete sizes[census];
              onRule({ kind: "custom", sizes });
            }}
          />
        </label>
      ))}
      <p class="field-hint">
        Blank means 435.
        {only && (
          <>
            {" "}
            {only.year} used the {only.census} census. Set the others on{" "}
            <a href={only.allHref}>All elections</a>.
          </>
        )}
      </p>
    </fieldset>
  );
}
