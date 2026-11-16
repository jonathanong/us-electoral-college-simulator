import { fireEvent, render, screen, within } from "@testing-library/preact";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../../src/ui/App.tsx";
import { data } from "../fixture.ts";

afterEach(() => history.replaceState(null, "", "/"));

const select = (label: string) => screen.getByLabelText(label) as HTMLSelectElement;
const change = (el: HTMLElement, value: string) => {
  (el as HTMLInputElement).value = value;
  fireEvent.change(el);
};

describe("App", () => {
  it("renders the answer, explorer and flip finder, and syncs the URL", () => {
    history.replaceState(null, "", "/?year=1992&rule=historical#about");
    render(<App data={data} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/kept growing/);
    expect(screen.getByRole("heading", { name: "Explore 1992" })).toBeTruthy();
    expect(screen.getAllByText(/Same outcome/)).toHaveLength(1);
    expect(location.search).toBe("?year=1992&rule=historical");
    expect(screen.getAllByRole("link", { name: /GitHub/ }).length).toBeGreaterThan(0);
  });

  it("ignores unknown hashes", () => {
    history.replaceState(null, "", "/?year=1992#nope");
    render(<App data={data} />);
    expect(location.hash).toBe("#nope");
  });

  it("changes rule, method, allocation, year and map mode", () => {
    history.replaceState(null, "", "/?year=1992");
    render(<App data={data} />);
    change(select("House size"), "fixed");
    const slider = screen.getByRole("slider");
    fireEvent.input(slider, { target: { value: "150" } });
    expect(location.search).toContain("size=150");
    expect(screen.getByRole("columnheader", { name: "150 seats" })).toBeTruthy();

    change(select("House size"), "ratio");
    const perSeat = screen.getByLabelText("People per seat");
    change(perSeat, "10");
    expect(location.search).toContain("perRep=30000");
    change(perSeat, "");
    expect(location.search).toContain("perRep=30000");
    change(perSeat, "60000");
    expect(location.search).toContain("perRep=60000");
    expect(screen.getByRole("columnheader", { name: "1 seat per 60,000" })).toBeTruthy();

    change(select("House size"), "custom");
    const c1990 = screen.getByLabelText("1990");
    change(c1990, "120");
    expect(location.search).toContain("1990%3A120");
    change(screen.getByLabelText("1990"), "1");
    expect(location.search).not.toContain("1990%3A");
    change(select("House size"), "custom");
    change(select("House size"), "wyoming");

    change(select("Apportionment method"), "hamilton");
    change(select("Split states"), "popular");
    expect(location.search).toContain("method=hamilton");
    expect(location.search).toContain("alloc=popular");

    change(select("Election"), "1996");
    expect(screen.getByRole("heading", { name: "Explore 1996" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Change vs real House" }));
    expect(
      screen.getByRole("button", { name: "Change vs real House" }).getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Winner & electors" }));
  });

  it("selects a year from the overview table and lists states", () => {
    history.replaceState(null, "", "/?year=1996&rule=fixed&size=200");
    render(<App data={data} />);
    const table = screen.getAllByRole("table")[0]!;
    fireEvent.click(within(table).getByRole("button", { name: "1992" }));
    expect(screen.getByRole("heading", { name: "Explore 1992" })).toBeTruthy();
    expect(screen.getByText(/All 3 states and DC/)).toBeTruthy();
    fireEvent.submit(screen.getByLabelText("Election").closest("form")!);
  });
});
