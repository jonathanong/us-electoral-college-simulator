import type { ComponentChildren } from "preact";

/** The settings sidebar: a card that stays in view beside the results on wide screens. */
export function RulesPanel({ children }: { children: ComponentChildren }) {
  return (
    <aside class="card rules" aria-label="Rules">
      <h2 class="card-title">Rules</h2>
      {children}
    </aside>
  );
}
