import { useEffect, useMemo, useState } from "preact/hooks";
import type { Dataset, Settings } from "../engine/types.ts";
import { AboutPage } from "./About.tsx";
import { SiteFooter, SiteHeader } from "./Layout.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { HouseSizePage } from "./pages/HouseSizePage.tsx";
import { MethodsPage } from "./pages/MethodsPage.tsx";
import { NotFoundPage } from "./pages/NotFoundPage.tsx";
import { YearPage } from "./pages/YearPage.tsx";
import { BASE, type Route, headFor, legacyPath, pathOf, routeOf } from "./routes.ts";
import { parseState, serializeSettings } from "./urlState.ts";

interface Loc {
  path: string;
  search: string;
}

const here = (): Loc => ({ path: location.pathname, search: location.search });

/** Whether a click on this anchor should become an in-app navigation. */
function internal(e: MouseEvent): URL | null {
  const a = (e.target as Element).closest("a");
  if (!a || a.target || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
    return null;
  }
  const url = new URL(a.href);
  const ours = url.origin === location.origin && url.pathname.startsWith(`${BASE}/`);
  return ours && !url.pathname.endsWith(".html") ? url : null;
}

export interface PageProps {
  data: Dataset;
  settings: Settings;
  onSettings: (settings: Settings) => void;
  /** A link to a route that keeps the current settings. */
  href: (route: Route) => string;
  go: (route: Route) => void;
}

/** `url` is the base-less path to prerender at build time; the browser uses its own location. */
export function App({ data, url }: { data: Dataset; url?: string }) {
  const years = useMemo(() => [...data.elections.keys()], [data]);
  const [loc, setLoc] = useState<Loc>(() =>
    url === undefined ? here() : { path: url, search: "" },
  );
  const route = routeOf(loc.path, years);
  const settings = useMemo(() => parseState(loc.search, years).settings, [loc.search, years]);
  const query = serializeSettings(settings);

  const push = (path: string, hash = "") => {
    history.pushState(null, "", path + hash);
    setLoc(here());
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else scrollTo?.(0, 0);
  };

  useEffect(() => {
    const moved = legacyPath(location.search, location.hash, years);
    if (routeOf(location.pathname, years).page === "home" && moved) {
      history.replaceState(null, "", BASE + moved);
      setLoc(here());
    }
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
    const onPop = () => setLoc(here());
    const onClick = (e: MouseEvent) => {
      const next = internal(e);
      if (!next) return;
      e.preventDefault();
      push(next.pathname + next.search, next.hash);
    };
    addEventListener("popstate", onPop);
    document.addEventListener("click", onClick);
    return () => {
      removeEventListener("popstate", onPop);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const head = headFor(route, data);
  useEffect(() => {
    document.title = head.title;
  }, [head.title]);

  const props: PageProps = {
    data,
    settings,
    onSettings: (next) => {
      history.replaceState(null, "", location.pathname + serializeSettings(next) + location.hash);
      setLoc(here());
    },
    href: (r) => BASE + pathOf(r) + query,
    go: (r) => push(BASE + pathOf(r) + query),
  };

  return (
    <>
      <SiteHeader route={route} href={props.href} />
      <main class="container">
        {route.page === "home" && <HomePage {...props} />}
        {route.page === "year" && <YearPage key={route.year} year={route.year} {...props} />}
        {route.page === "house-size" && <HouseSizePage {...props} />}
        {route.page === "voting-methods" && <MethodsPage {...props} />}
        {route.page === "about" && <AboutPage />}
        {route.page === "not-found" && <NotFoundPage href={props.href} />}
      </main>
      <SiteFooter years={years} href={props.href} />
    </>
  );
}
