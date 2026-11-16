# What if the House had kept growing?

[![CI](https://github.com/jonathanong/us-electoral-college-simulator/actions/workflows/ci.yml/badge.svg)](https://github.com/jonathanong/us-electoral-college-simulator/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/jonathanong/us-electoral-college-simulator/graph/badge.svg)](https://codecov.io/gh/jonathanong/us-electoral-college-simulator)

**Live site: https://jongleberry.com/us-electoral-college-simulator/**

Each state's electoral votes equal its House seats plus two. The House stopped growing at 435 seats
after the 1910 census ([Apportionment Act of 1911](https://en.wikipedia.org/wiki/Apportionment_Act_of_1911),
made permanent by the [Reapportionment Act of 1929](https://en.wikipedia.org/wiki/Reapportionment_Act_of_1929)).
This site replays every presidential election from 1912 to 2024 under a different House size and
shows whether the winner changes.

## Features

- **The short answer:** every election under the real House, the
  [cube root rule](https://thearp.org/blog/the-cube-root-rule/) and the
  [Wyoming rule](https://thearp.org/blog/the-wyoming-rule/), with changed outcomes highlighted.
- **Explore an election:** pick a year and a House size rule (fixed size, people per seat, or a
  custom size after each census), an apportionment method (Huntington–Hill, Webster, Jefferson,
  Hamilton), and how split states are handled. A map shows winners or the change in electors.
- **Flip finder:** every House size from 100 to 2,000 for one election, showing where the winner changes.
- Shareable URLs, and works on phones and desktops in light and dark mode.

## Method

- Seats are apportioned from each census's apportionment population, with every state guaranteed one seat.
  Counterfactual Houses are also reapportioned after the 1920 census, which was skipped in reality.
- Electoral votes = seats + 2. From 1964, DC gets as many electors as it would as a state, capped at the
  smallest state ([23rd Amendment](https://en.wikipedia.org/wiki/Twenty-third_Amendment_to_the_United_States_Constitution)).
- Votes are held fixed. Faithless electors are returned to the candidate they were pledged to. Split
  delegations are scaled proportionally, or given to the popular-vote winner if you choose that option.
- **Maine (1972+) and Nebraska (1992+):** two electors go to the statewide winner, and district
  electors are scaled from the real district split. This is a best-effort estimate, since more
  districts would be drawn differently.
- If nobody wins a majority, the site reports that the House would choose (one vote per state delegation).

## Data

CSV files live in [`data/csv`](data/csv). Sources, retrieval dates and judgement calls are documented in
[`data/SOURCES.md`](data/SOURCES.md). The data directory is licensed
[CC BY-SA 4.0](data/LICENSE) because parts of it derive from Wikipedia. Main sources:

- [U.S. Census Bureau historical apportionment data](https://www.census.gov/data/tables/time-series/dec/apportionment-data-text.html)
- [National Archives: Electoral College results](https://www.archives.gov/electoral-college/results)
- [MIT Election Data and Science Lab](https://electionlab.mit.edu/data)
- Wikipedia's "United States presidential election" articles for state-level results

## References

- [American Redistricting Project: The cube root rule](https://thearp.org/blog/the-cube-root-rule/) and
  [the Wyoming rule](https://thearp.org/blog/the-wyoming-rule/)
- [American Academy of Arts & Sciences: Enlarging the House of Representatives](https://www.amacad.org/ourcommonpurpose/enlarging-House-representatives)
- [FairVote: Why 435? How we can change the size of the House](https://fairvote.org/how_we_can_change_the_size_of_the_house_of_representatives/)
- [Protect Democracy: Expanding the House of Representatives, explained](https://protectdemocracy.org/work/expanding-the-house-of-representatives-explained/)
- [Nicholas R. Miller (LSE USAPP): House size could still determine presidential outcomes](https://blogs.lse.ac.uk/usappblog/2014/11/27/even-without-senate-electoral-votes-the-size-of-the-u-s-house-of-representatives-could-still-determine-the-outcome-of-presidential-elections)
- Neubauer, M. G. & Zeitlin, J. (2003). "Outcomes of Presidential Elections and the House Size." _PS: Political Science & Politics_ 36(4).
- [Wikipedia: United States congressional apportionment](https://en.wikipedia.org/wiki/United_States_congressional_apportionment)

## Development

Requires Node 24+ and pnpm.

```sh
pnpm install
pnpm dev          # local site
pnpm test         # unit tests, 100% coverage enforced
pnpm run lint && pnpm run format:check && pnpm run typecheck
pnpm run build
```

The simulation engine (`src/engine`) is plain TypeScript with no UI dependencies. The UI is Preact,
with a map built from [us-atlas](https://github.com/topojson/us-atlas) and d3-geo.

## License

Code: [MIT](LICENSE). Data: [CC BY-SA 4.0](data/LICENSE).
