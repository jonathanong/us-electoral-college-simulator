import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/ui/App.tsx";
import { data } from "../fixture.ts";

afterEach(() => history.replaceState(null, "", "/"));

const select = (label: string) => screen.getByLabelText(label) as HTMLSelectElement;
const change = (el: HTMLElement, value: string) => {
  (el as HTMLInputElement).value = value;
  fireEvent.change(el);
};
const open = (url: string) => {
  history.replaceState(null, "", url);
  return render(<App data={data} />);
};
const link = (href: string, attrs: Record<string, string> = {}) => {
  const a = Object.assign(document.createElement("a"), { href, textContent: href });
  for (const [k, v] of Object.entries(attrs)) a.setAttribute(k, v);
  document.body.append(a);
  return a;
};
const click = (a: HTMLElement, init: MouseEventInit = {}) =>
  a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...init }));
const h1 = () => screen.getByRole("heading", { level: 1 }).textContent;

describe("home: every election with your rules", () => {
  it("compares each election with what happened and keeps settings in the URL", () => {
    open("/");
    expect(h1()).toMatch(/elected differently/);
    expect(screen.queryByLabelText("Election")).toBeNull();
    change(select("House size"), "fixed");
    fireEvent.input(screen.getByRole("slider"), { target: { value: "150" } });
    expect(location.search).toBe("?rule=fixed&size=150");
    change(select("House size"), "ratio");
    const perSeat = screen.getByLabelText("People per seat");
    change(perSeat, "10");
    expect(location.search).toContain("perRep=30000");
    change(perSeat, "");
    change(perSeat, "60000");
    expect(location.search).toContain("perRep=60000");
    change(select("House size"), "custom");
    change(screen.getByLabelText("1990"), "120");
    expect(location.search).toContain("1990%3A120");
    change(screen.getByLabelText("1990"), "1");
    expect(location.search).not.toContain("1990%3A");
    change(select("House size"), "custom");
    change(select("House size"), "historical");
    expect(screen.getByText(/No winner changes in any of the 2 elections/)).toBeTruthy();
    change(select("Apportionment method"), "hamilton");
    change(select("Split states"), "popular");
    expect(location.search).toContain("method=hamilton&alloc=popular");
    change(select("Voting method"), "national");
    expect(screen.queryByLabelText("House size")).toBeNull();
    expect(screen.getAllByText(/% of the vote/).length).toBeGreaterThan(0);
    fireEvent.submit(document.querySelector("form")!);
  });

  it("shows ranked-choice sliders for each election in the grid", () => {
    open("/?system=ranked-choice");
    expect(screen.getByText(/in each election's row/)).toBeTruthy();
    const slider = screen.getByLabelText(/^1992: share of Others' voters ranking .* over Dee$/);
    fireEvent.input(slider, { target: { value: "20" } });
    expect(location.search).toContain("rcv=1992.other%3A80");
    expect(slider.closest("label")!.textContent).toMatch(/Others' voters · .*Dee 80%/);
  });
});

describe("navigation", () => {
  it("follows internal links in the page, keeping settings, and handles back", async () => {
    open("/?rule=historical");
    const table = screen.getAllByRole("table")[0]!;
    fireEvent.click(within(table).getByRole("link", { name: "1992" }));
    expect(location.pathname).toBe("/elections/1992/");
    expect(location.search).toBe("?rule=historical");
    expect(h1()).toBe("The 1992 election");
    expect(document.title).toMatch(/^1992 Election \(Dee vs\. Arr\)/);
    fireEvent.click(screen.getByRole("link", { name: "1996 →" }));
    expect(h1()).toBe("The 1996 election");
    const back = new Promise((resolve) => addEventListener("popstate", resolve, { once: true }));
    history.back();
    await back;
    await waitFor(() => expect(h1()).toBe("The 1992 election"));
    expect(location.pathname + location.search).toBe("/elections/1992/?rule=historical");
  });

  it("follows the address when it changes outside the app", () => {
    open("/");
    history.replaceState(null, "", "/about/");
    fireEvent(window, new PopStateEvent("popstate"));
    expect(h1()).toBe("How it works");
  });

  it("leaves external, modified, targeted and file links to the browser", () => {
    open("/");
    expect(click(link("https://example.com/"))).toBe(true);
    expect(click(link("/about/"), { metaKey: true })).toBe(true);
    expect(click(link("/about/", { target: "_blank" }))).toBe(true);
    expect(click(link("/404.html"))).toBe(true);
    expect(click(document.body)).toBe(true);
    expect(fireEvent.click(link("/about/#top"))).toBe(false);
    expect(h1()).toBe("How it works");
  });

  it("moves links to the old single-page site and scrolls to the old anchor", async () => {
    const scroll = vi.spyOn(Element.prototype, "scrollIntoView");
    open("/?year=1992&rule=historical#flips");
    expect(location.pathname).toBe("/elections/1992/");
    await waitFor(() => expect(scroll.mock.contexts).toContain(document.getElementById("flips")));
    scroll.mockRestore();
    cleanup();
    open("/?year=1992&rule=historical#about");
    expect(location.pathname).toBe("/about/");
    expect(location.search).toBe("?rule=historical");
    expect(h1()).toBe("How it works");
  });

  it("prerenders the page it is given", () => {
    history.replaceState(null, "", "/?rule=wyoming");
    render(<App data={data} url="/voting-methods" />);
    expect(h1()).toBe("What if we voted differently?");
  });
});

describe("pages", () => {
  it("explores one election with every voting method", () => {
    open("/elections/1992/?rule=historical#flips");
    expect(screen.getByText(/Same outcome/)).toBeTruthy();
    const nav = screen.getByRole("navigation", { name: "Site" });
    expect(
      within(nav).getByRole("link", { name: "All elections" }).getAttribute("aria-current"),
    ).toBe("page");
    change(select("Voting method"), "ranked-choice");
    const slider = screen.getByLabelText(/^1992: share of Others' voters ranking .* over Dee$/);
    fireEvent.input(slider, { target: { value: "20" } });
    expect(location.search).toContain("rcv=1992.other%3A80");
    change(select("Voting method"), "national");
    expect(document.getElementById("flips")).toBeNull();
    expect(screen.getByRole("img", { name: "Popular vote shares" })).toBeTruthy();
    change(select("Voting method"), "fractional");
    expect(screen.getByText(/most wins/)).toBeTruthy();
    change(select("Voting method"), "bonus");
    expect(screen.getByText(/including 102 bonus for Dee/)).toBeTruthy();
    change(select("House size"), "fixed");
    fireEvent.input(screen.getByRole("slider"), { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: "Change vs real House" }));
    expect(
      screen.getByRole("button", { name: "Change vs real House" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.getByText(/All 3 states and DC/)).toBeTruthy();
    change(select("Election"), "1996");
    expect(location.pathname).toBe("/elections/1996/");
    expect(screen.getByRole("link", { name: "← 1992" })).toBeTruthy();
  });

  it("asks only for the census an election used", () => {
    open("/elections/1996/?rule=custom");
    expect(screen.getByText("Seats after the 1990 census")).toBeTruthy();
    expect(screen.queryByLabelText("2000")).toBeNull();
    change(screen.getByLabelText("1990"), "200");
    expect(location.search).toContain("1990%3A200");
    expect(screen.getByText(/1996 used the 1990 census/)).toBeTruthy();
    fireEvent.click(
      within(document.querySelector(".census-sizes")!).getByRole("link", { name: "All elections" }),
    );
    expect(location.pathname).toBe("/");
    expect(screen.getByText("Seats after each census")).toBeTruthy();
    expect(screen.getByLabelText("2000")).toBeTruthy();
  });

  it("compares House sizes, including your own", () => {
    open("/house-size/?rule=fixed&size=200");
    expect(h1()).toBe("What if the House had kept growing?");
    expect(screen.getByRole("columnheader", { name: "200 seats" })).toBeTruthy();
    expect(screen.getByText(/Electoral votes count faithless electors/)).toBeTruthy();
    cleanup();
    open("/house-size/?rule=ratio&perRep=60000");
    expect(screen.getByRole("columnheader", { name: "1 seat per 60,000" })).toBeTruthy();
    cleanup();
    open("/house-size/");
    expect(screen.queryByRole("columnheader", { name: "Cube root" })).toBeTruthy();
    cleanup();
    open("/house-size/?rule=custom");
    expect(screen.getByRole("columnheader", { name: "Custom size per census" })).toBeTruthy();
  });

  it("compares voting methods with their sources", () => {
    open("/voting-methods/");
    expect(screen.getByRole("columnheader", { name: "Proportional" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Colorado 2004 ballot/ })).toBeTruthy();
  });

  it("explains unknown pages", () => {
    open("/nope/");
    expect(h1()).toBe("Page not found");
    expect(screen.getAllByRole("link", { name: /GitHub/ }).length).toBeGreaterThan(0);
  });
});
