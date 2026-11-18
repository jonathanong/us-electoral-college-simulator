import { REPO_URL } from "./About.tsx";
import { type Route, SITE_NAME } from "./routes.ts";

const NAV: readonly { route: Route; label: string }[] = [
  { route: { page: "home" }, label: "All elections" },
  { route: { page: "house-size" }, label: "House size" },
  { route: { page: "voting-methods" }, label: "Voting methods" },
  { route: { page: "about" }, label: "How it works" },
];

interface HeaderProps {
  route: Route;
  href: (route: Route) => string;
}

/** Election pages sit under "All elections". */
const current = (item: Route, route: Route) =>
  item.page === route.page || (item.page === "home" && route.page === "year");

export function SiteHeader({ route, href }: HeaderProps) {
  return (
    <header class="site-header">
      <div class="container site-header-inner">
        <a class="brand" href={href({ page: "home" })}>
          <svg viewBox="0 0 24 24" aria-hidden="true" class="brand-mark">
            <rect x="2" y="12" width="5" height="10" rx="1" />
            <rect x="9.5" y="6" width="5" height="16" rx="1" />
            <rect x="17" y="2" width="5" height="20" rx="1" />
          </svg>
          {SITE_NAME}
        </a>
        <nav aria-label="Site">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={href(item.route)}
              aria-current={current(item.route, route) ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a class="gh" href={REPO_URL} aria-label="GitHub">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </div>
    </header>
  );
}

interface FooterProps {
  years: readonly number[];
  href: (route: Route) => string;
}

export function SiteFooter({ years, href }: FooterProps) {
  return (
    <footer class="site-footer">
      <div class="container">
        <nav aria-label="Elections" class="year-links">
          {years.map((year) => (
            <a key={year} href={href({ page: "year", year })}>
              {year}
            </a>
          ))}
        </nav>
        <p>
          <a href={REPO_URL}>Source on GitHub</a> · Code MIT · Data CC BY-SA 4.0 (see{" "}
          <a href={`${REPO_URL}/blob/main/data/SOURCES.md`}>sources</a>)
        </p>
      </div>
    </footer>
  );
}
