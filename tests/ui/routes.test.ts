import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dataset } from "../../src/data/index.ts";
import { allPaths, headFor, legacyPath, matchup, pathOf, routeOf } from "../../src/ui/routes.ts";
import { data } from "../fixture.ts";

const years = [1992, 1996];

describe("routeOf and pathOf", () => {
  it("parses every page, with or without the deploy prefix", () => {
    const base = "/us-electoral-college-simulator";
    expect(routeOf(`${base}/`, years, base)).toEqual({ page: "home" });
    expect(routeOf(base, years, base)).toEqual({ page: "home" });
    expect(routeOf(`${base}/index.html`, years, base)).toEqual({ page: "home" });
    expect(routeOf("/elections/1992", years, base)).toEqual({ page: "year", year: 1992 });
    expect(routeOf("/elections/1992/", years)).toEqual({ page: "year", year: 1992 });
    expect(routeOf("/elections/1900/", years)).toEqual({ page: "not-found" });
    expect(routeOf("/house-size/", years)).toEqual({ page: "house-size" });
    expect(routeOf("/voting-methods", years)).toEqual({ page: "voting-methods" });
    expect(routeOf("/about/", years)).toEqual({ page: "about" });
    expect(routeOf("/nope/", years)).toEqual({ page: "not-found" });
    expect(routeOf("/404.html", years)).toEqual({ page: "not-found" });
  });

  it("lists every page once, and the sitemap lists every indexable one", () => {
    const paths = allPaths(years);
    expect(paths).toEqual([
      "/",
      "/house-size/",
      "/voting-methods/",
      "/about/",
      "/elections/1992/",
      "/elections/1996/",
      "/404.html",
    ]);
    for (const path of paths) expect(pathOf(routeOf(path, years))).toBe(path);
    const sitemap = readFileSync("public/sitemap.xml", "utf8");
    const listed = [...sitemap.matchAll(/<loc>https:\/\/[^/]+\/[^/]+(\/[^<]*)<\/loc>/g)].map(
      (m) => m[1],
    );
    const real = allPaths([...dataset.elections.keys()]).filter((p) => p !== "/404.html");
    expect(listed).toEqual(real);
  });
});

describe("legacyPath", () => {
  it("moves old single-page links to their new pages", () => {
    expect(legacyPath("", "", years)).toBeNull();
    expect(legacyPath("?rule=wyoming", "#nope", years)).toBeNull();
    expect(legacyPath("?year=1992&rule=cube-root", "", years)).toBe("/elections/1992/");
    expect(legacyPath("?year=1992&rule=wyoming", "#flips", years)).toBe(
      "/elections/1992/?rule=wyoming#flips",
    );
    expect(legacyPath("?year=1800", "#explore", years)).toBe("/elections/2024/");
    expect(legacyPath("?year=1992&rule=historical", "#answer", years)).toBe(
      "/house-size/?rule=historical",
    );
    expect(legacyPath("", "#methods", years)).toBe("/voting-methods/");
    expect(legacyPath("", "#about", years)).toBe("/about/");
  });
});

describe("headFor", () => {
  it("titles and describes every page", () => {
    expect(matchup(data, 1992)).toBe("Dee vs. Arr");
    const pages = [
      { page: "home" },
      { page: "year", year: 1992 },
      { page: "house-size" },
      { page: "voting-methods" },
      { page: "about" },
    ] as const;
    const heads = pages.map((r) => headFor(r, data));
    expect(new Set(heads.map((h) => h.title)).size).toBe(pages.length);
    expect(heads[1]!.title).toBe(
      "1992 Election (Dee vs. Arr): What If? · Electoral College Simulator",
    );
    expect(heads[1]!.url).toBe(
      "https://jongleberry.com/us-electoral-college-simulator/elections/1992/",
    );
    expect(heads.every((h) => h.description.length > 50)).toBe(true);
    expect(headFor({ page: "not-found" }, data).title).toMatch(/not found/);
  });
});
