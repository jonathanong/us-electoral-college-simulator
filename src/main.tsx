import { hydrate, render } from "preact";
import { dataset } from "./data/index.ts";
import { App } from "./ui/App.tsx";
import "./ui/styles.css";

if (typeof window !== "undefined") {
  const root = document.getElementById("app")!;
  // The HTML is prerendered for the default view. A shared link with settings renders fresh
  // instead, because hydrating different markup would leave stale text behind.
  if (location.search) {
    root.textContent = "";
    render(<App data={dataset} />, root);
  } else {
    hydrate(<App data={dataset} />, root);
  }
}

/** Called at build time by @preact/preset-vite to write static HTML for crawlers. */
export async function prerender() {
  const { renderToString } = await import("preact-render-to-string");
  return { html: renderToString(<App data={dataset} search="" />) };
}
