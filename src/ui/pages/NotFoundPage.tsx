import type { Route } from "../routes.ts";

export function NotFoundPage({ href }: { href: (route: Route) => string }) {
  return (
    <div class="page-head">
      <h1>Page not found</h1>
      <p class="lead">
        That page doesn't exist. Try <a href={href({ page: "home" })}>all elections</a>.
      </p>
    </div>
  );
}
