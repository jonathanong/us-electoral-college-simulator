import { simulate } from "../engine/simulate.ts";
import type { Dataset } from "../engine/types.ts";
import { shortName } from "./colors.ts";
import { DEFAULT_STATE } from "./urlState.ts";

export type Route =
  | { page: "home" }
  | { page: "year"; year: number }
  | { page: "house-size" }
  | { page: "voting-methods" }
  | { page: "about" }
  | { page: "not-found" };

export const SITE_NAME = "Electoral College Simulator";
export const SITE_URL = "https://jongleberry.com/us-electoral-college-simulator";
/** The deploy prefix, without a trailing slash ("" in tests run without one). */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const PAGES = ["house-size", "voting-methods", "about"] as const;

/** A pathname (with or without the deploy prefix) to a route. */
export function routeOf(pathname: string, years: readonly number[], base = BASE): Route {
  const path = (pathname.startsWith(base) ? pathname.slice(base.length) : pathname)
    .replace(/index\.html$/, "")
    .replace(/\/+$/, "");
  if (path === "") return { page: "home" };
  const year = /^\/elections\/(\d{4})$/.exec(path);
  if (year && years.includes(Number(year[1]))) return { page: "year", year: Number(year[1]) };
  const page = PAGES.find((p) => path === `/${p}`);
  return page ? { page } : { page: "not-found" };
}

/** The route's path without the deploy prefix, with a trailing slash. */
export function pathOf(route: Route): string {
  switch (route.page) {
    case "home":
      return "/";
    case "year":
      return `/elections/${route.year}/`;
    case "not-found":
      return "/404.html";
    default:
      return `/${route.page}/`;
  }
}

/** Every page the build writes, so GitHub Pages can serve each one as a file. */
export function allPaths(years: readonly number[]): string[] {
  return [
    ...[{ page: "home" }, ...PAGES.map((page) => ({ page }))].map((r) => pathOf(r as Route)),
    ...years.map((year) => pathOf({ page: "year", year })),
    pathOf({ page: "not-found" }),
  ];
}

const OLD_ANCHORS: Readonly<Record<string, Route["page"]>> = {
  "#answer": "house-size",
  "#methods": "voting-methods",
  "#about": "about",
};

/** Where a link to the old single-page site (`/?year=1992#about`) now lives, if it moved. */
export function legacyPath(search: string, hash: string, years: readonly number[]): string | null {
  const params = new URLSearchParams(search);
  const page = OLD_ANCHORS[hash];
  if (!params.has("year") && !page && hash !== "#explore" && hash !== "#flips") return null;
  const year = Number(params.get("year"));
  params.delete("year");
  // The old default always wrote rule=cube-root; it is the default here too.
  if (params.get("rule") === DEFAULT_STATE.settings.rule.kind) params.delete("rule");
  const query = params.size > 0 ? `?${params}` : "";
  if (page) return pathOf({ page } as Route) + query;
  const route: Route = { page: "year", year: years.includes(year) ? year : DEFAULT_STATE.year };
  return pathOf(route) + query + (hash === "#flips" ? hash : "");
}

/** "Bush vs. Gore": the real winner and runner-up by electoral votes. */
export function matchup(data: Dataset, year: number): string {
  const real = simulate(data, year, {
    ...DEFAULT_STATE.settings,
    rule: { kind: "historical" },
  });
  const { candidates } = data.elections.get(year)!;
  return Object.entries(real.totals)
    .toSorted((x, y) => y[1] - x[1])
    .slice(0, 2)
    .map(([id]) => shortName(candidates, id))
    .join(" vs. ");
}

export interface Head {
  title: string;
  description: string;
  /** Absolute URL of the page. */
  url: string;
}

export function headFor(route: Route, data: Dataset): Head {
  const url = `${SITE_URL}${pathOf(route)}`;
  const years = [...data.elections.keys()];
  const span = `${years[0]}–${years.at(-1)}`;
  switch (route.page) {
    case "year":
      return {
        title: `${route.year} Election (${matchup(data, route.year)}): What If? · ${SITE_NAME}`,
        description: `Replay the ${route.year} presidential election, ${matchup(data, route.year)}, with a bigger House of Representatives or a different way of awarding electors, state by state.`,
        url,
      };
    case "house-size":
      return {
        title: `What If the House Had Kept Growing? · ${SITE_NAME}`,
        description: `Every presidential election from ${span} with the real 435-seat House, the cube root rule and the Wyoming rule. See which winners change.`,
        url,
      };
    case "voting-methods":
      return {
        title: `What If We Voted Differently? · ${SITE_NAME}`,
        description: `Every presidential election from ${span} under the national popular vote, Colorado's proportional plan, Lodge–Gossett, the district method, the National Bonus Plan and ranked choice.`,
        url,
      };
    case "about":
      return {
        title: `How It Works · ${SITE_NAME}`,
        description:
          "How the simulator apportions the House, awards electors under each voting method, and handles faithless electors, split states and third parties, with sources.",
        url,
      };
    case "not-found":
      return { title: `Page not found · ${SITE_NAME}`, description: "", url };
    default:
      return {
        title: `${SITE_NAME}: What If Presidents Were Elected Differently? (${span})`,
        description: `Replay every U.S. presidential election from ${span} with a bigger House of Representatives or a different voting method, from the national popular vote to ranked choice, and see which winners change.`,
        url,
      };
  }
}
