import type { Dataset } from "../engine/types.ts";
import type { Column } from "./Overview.tsx";

interface Props {
  data: Dataset;
  columns: readonly Column[];
  /** Per column, the years whose winner differs from the real House. */
  flips: readonly (readonly number[])[];
}

export function Summary({ data, columns, flips }: Props) {
  const total = data.elections.size;
  return (
    <ul class="summary">
      {columns.slice(1).map((c, i) => {
        const years = flips[i + 1]!;
        return (
          <li key={c.key}>
            <b>{c.label}:</b>{" "}
            {years.length === 0
              ? `no change in any of the ${total} elections.`
              : `${years.length} of ${total} elections would have had a different outcome (${years.join(", ")}).`}
          </li>
        );
      })}
    </ul>
  );
}
