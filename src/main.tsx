import { hydrate, render } from "preact";
import { dataset } from "./data/index.ts";
import { App } from "./ui/App.tsx";
import { allPaths, headFor, routeOf } from "./ui/routes.ts";
import "@fontsource-variable/geist";
import "./ui/styles.css";

if (typeof window !== "undefined") {
  const root = document.getElementById("app")!;
  // Each page is prerendered with default settings. A shared link with settings renders fresh
  // instead, because hydrating different markup would leave stale text behind.
  if (location.search) {
    root.textContent = "";
    render(<App data={dataset} />, root);
  } else {
    hydrate(<App data={dataset} />, root);
  }
}

/** Called at build time by @preact/preset-vite to write static HTML for every page. */
export async function prerender({ url }: { url: string }) {
  const { renderToString } = await import("preact-render-to-string");
  const years = [...dataset.elections.keys()];
  const route = routeOf(url, years);
  const head = headFor(route, dataset);
  const meta = (attr: "name" | "property", key: string, content: string) => ({
    type: "meta",
    props: { [attr]: key, content },
  });
  const elements =
    route.page === "not-found"
      ? [meta("name", "robots", "noindex")]
      : [
          meta("name", "description", head.description),
          { type: "link", props: { rel: "canonical", href: head.url } },
          meta("property", "og:url", head.url),
          meta("property", "og:title", head.title),
          meta("property", "og:description", head.description),
        ];
  return {
    html: renderToString(<App data={dataset} url={url} />),
    links: new Set(allPaths(years)),
    head: { lang: "en", title: head.title, elements: new Set(elements) },
  };
}
