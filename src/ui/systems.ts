import type { VotingSystem } from "../engine/types.ts";

export interface SystemInfo {
  label: string;
  /** Column heading in the comparison table. */
  short: string;
  summary: string;
  refs: readonly { text: string; href: string }[];
}

const EVE_CH4 = "https://www.every-vote-equal.com/downloads/EVE-5th-Ed-2nd-Printing-Ch-4.pdf";

export const SYSTEM_INFO: Readonly<Record<VotingSystem, SystemInfo>> = {
  "winner-take-all": {
    label: "Winner-take-all (today)",
    short: "Today",
    summary:
      "Each state's popular-vote winner takes all of its electors (Maine and Nebraska split theirs by congressional district). A majority of electors wins; otherwise the House picks.",
    refs: [],
  },
  national: {
    label: "National popular vote",
    short: "Popular vote",
    summary:
      "The most votes nationwide wins. The National Popular Vote Interstate Compact does this once states with 270 electoral votes join (18 states and DC with 222 so far). The Bayh–Celler amendment (1969) would have done it directly; it passed the House 339–70 and died in a Senate filibuster. Its 40% runoff threshold was never needed: every winner since 1912 had more.",
    refs: [
      {
        text: "National Popular Vote: state status",
        href: "https://www.nationalpopularvote.com/state-status",
      },
      {
        text: "Bayh–Celler amendment (Wikipedia)",
        href: "https://en.wikipedia.org/wiki/Bayh%E2%80%93Celler_amendment",
      },
    ],
  },
  proportional: {
    label: "Proportional electors (Colorado 2004)",
    short: "Proportional",
    summary:
      "Colorado Amendment 36 (rejected 65–35 in 2004): each ticket gets its share of the state's electors rounded to the nearest whole number. Over-allocations come off the smallest ticket that has an elector; any shortfall goes to the leader. A majority of electors is still needed, so close three-way races go to the House.",
    refs: [
      {
        text: "Colorado 2004 ballot information booklet (full text)",
        href: "https://co.elstats2.civera.com/eng/files/serve/183",
      },
      {
        text: "2004 Colorado Amendment 36 (Wikipedia)",
        href: "https://en.wikipedia.org/wiki/2004_Colorado_Amendment_36",
      },
    ],
  },
  fractional: {
    label: "Fractional electors (Lodge–Gossett 1950)",
    short: "Fractional",
    summary:
      "The Lodge–Gossett amendment (S.J.Res. 2) passed the Senate 64–27 in 1950 and failed in the House. Electors are abolished: each candidate gets their exact share of each state's electoral votes, to three decimal places, and the most electoral votes wins, with no majority needed.",
    refs: [
      {
        text: "National Popular Vote memo on Lodge–Gossett (PDF)",
        href: "https://www.nationalpopularvote.com/sites/default/files/memo-fractional-proportional-lodge-gossett-v4-2021-5-1.pdf",
      },
    ],
  },
  district: {
    label: "Statewide winner +2, rest proportional",
    short: "District-style",
    summary:
      "An estimate of the Maine (since 1972) and Nebraska (since 1992) district method used everywhere: the statewide winner gets the two Senate electors. District results aren't available for most years, and a bigger House would redraw every district, so the House electors are split in proportion to the statewide vote instead. Pennsylvania's SB 538 (2013) proposed exactly this split; it died in committee.",
    refs: [
      {
        text: "Maine statute 21-A §805",
        href: "https://legislature.maine.gov/statutes/21-A/title21-Asec805.html",
      },
      {
        text: "Nebraska statute 32-714",
        href: "https://nebraskalegislature.gov/laws/statutes.php?statute=32-714",
      },
      {
        text: "Pennsylvania proportional plan memo (2012)",
        href: "https://p2012.org/chrneday/paelectoral120312.html",
      },
    ],
  },
  bonus: {
    label: "National Bonus Plan (1978)",
    short: "Bonus",
    summary:
      "Proposed by the Twentieth Century Fund task force and introduced by Sen. Birch Bayh (S.J.Res. 123, 1978): today's system plus 102 bonus electors (two per state and DC) for the national popular-vote winner. A majority of all electors still wins.",
    refs: [
      { text: "Every Vote Equal, chapter 4 (PDF)", href: EVE_CH4 },
      {
        text: "S.J.Res. 123 (95th Congress)",
        href: "https://www.congress.gov/bill/95th-congress/senate-joint-resolution/123",
      },
    ],
  },
  "ranked-choice": {
    label: "Ranked choice in each state (Maine 2020)",
    short: "Ranked choice",
    summary:
      "Each state runs an instant runoff, as Maine has since 2020 and Alaska since 2024. Real ballots weren't ranked, so you choose where each eliminated candidate's voters go next. With an even split, no election changes.",
    refs: [
      {
        text: "Maine P.L. 2019, c. 539 (PDF)",
        href: "https://lldc.mainelegislature.org/Open/Laws/2019/2019_PL_c539.pdf",
      },
      {
        text: "Alaska Ballot Measure 2 (2020), Ballotpedia",
        href: "https://ballotpedia.org/Alaska_Ranked-Choice_Voting_Initiative_(2020)",
      },
    ],
  },
};

/** Electoral votes, with fractions (Lodge–Gossett) to one decimal place. */
export function formatEv(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}
