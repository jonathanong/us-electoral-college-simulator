# Data sources

Retrieved 2026-11-15. Everything under `data/csv/` is UTF-8 with a header row, no thousands separators,
and 2-letter USPS state codes (incl. `DC`). The files other than `census-apportionment.csv` are generated
by the TypeScript scripts in `scripts/` (Node 24+, `node scripts/<name>.ts`).

## Licenses of sources

| Source | License |
| --- | --- |
| U.S. Census Bureau tables | US government work, public domain |
| National Archives (NARA) Electoral College records | US government work, public domain |
| MIT Election Data + Science Lab, U.S. President 1976-2024 | CC0 1.0 |
| Wikipedia "YEAR United States presidential election" (state results tables, infobox totals), "Faithless elector" | CC BY-SA 4.0 |

Because part of the data derives from Wikipedia, the `data/` directory as a whole is offered under
CC BY-SA 4.0 (see `LICENSE`).

## Files

### `census-apportionment.csv`
Census Bureau, "Historical Apportionment Data (1910-2020)",
https://www2.census.gov/programs-surveys/decennial/2020/data/apportionment/apportionment.csv
(also `apportionment-data-table.xlsx`). Unmodified. Public domain.

### `apportionment-population.csv` (`census,state,apportionment_population`)
Built by `scripts/build-apportionment.ts`; checked by `scripts/validate-hh.ts`.
- 1990, 2000, 2010, 2020: exact apportionment populations from Census Bureau tables, converted with
  `pdftotext -layout`:
  `.../decennial/2020/data/apportionment/apportionment-2020-table01.pdf`,
  `.../2010/data/apportionment/apport2010-table1.pdf`, `.../2000/data/apportionment/tab01.pdf`,
  `.../1990/data/apportionment/transmittal-table.pdf` (all under https://www2.census.gov/programs-surveys/decennial/).
- 1910-1980: no per-state apportionment-population table was reachable. The Census Bureau's
  `census-apportionment.csv` publishes, for each state and census, "Average Apportionment Population Per
  Representative" (apportionment population / seats, rounded to an integer). For each state we use the
  resident population when `average x seats` agrees with it within rounding (this is all of 1940, 1950,
  1960), and otherwise `average x seats`. That is exact for one-seat states and otherwise within
  +/- seats/2 persons (at most ~27 for California) of the published figure. Estimated rows (resident
  population differs from the apportionment population, because of Indians not taxed in 1910-1930,
  overseas personnel in 1970, and the original-vs-revised counts in 1980): 1910 13 states, 1920 15, 1930 42,
  1970 all 50, 1980 39. Summed 1970 estimates are within 30 persons of the 204,053,325 national total.
- Territory rows (resident population): AZ and NM in 1910; AK and HI in 1950; DC for 1960-2020. The
  Census excludes DC from the apportionment population, so DC rows are the resident population.
- 1920 is included although it was never used for apportionment (the table's 1920 seat column repeats the
  1910 allocation, so Huntington-Hill intentionally does not reproduce it).
- Validation: Huntington-Hill on 435 seats reproduces the Census seat counts exactly for 1940, 1950 (48
  states), 1960, 1970, 1980, 1990, 2000, 2010, 2020 (and incidentally 1910 at 433 seats and 1930).

### `candidates.csv`, `electoral-votes.csv`, `popular-votes.csv`, `me-ne-districts.csv`, `faithless.csv`
Candidate roster: everyone with at least one electoral vote or at least 1% of the national popular vote
(`scripts/candidates.ts`). Candidate ids are lowercase surnames. Party labels: `D`, `R`, otherwise a short
label. Faithless-only candidates (Jones 1956, Reagan 1976, Bentsen 1988, Edwards 2004, Powell, Kasich,
Paul, Spotted Eagle, Sanders 2016) and `abstain` (DC 2000) appear in electoral votes only.
Borderline exclusions: 1920 Christensen (0.99%), 1976 McCarthy (0.91%), 2012 Gary Johnson (0.99%).

- **Electoral votes** (`electoral-votes.csv`): the electoral-vote columns of the Wikipedia "Results by state"
  tables (CC BY-SA 4.0), which agree with NARA certificates, plus the faithless/abstaining votes the tables
  omit (`scripts/overrides.ts`; sources: NARA and Wikipedia "Faithless elector"). Maine and Nebraska rows
  aggregate the two at-large electors and the district electors. `scripts/validate.ts` checks, for every
  year, that each state's electors equal its seats + 2 (3 for DC, AK/HI 1960, AZ/NM 1912), national
  totals are 531 (1912-1956), 537 (1960), 538 (1964-2024), and every candidate's national total equals the
  official count.
- **Faithless** (`faithless.csv`): one row per faithless or abstaining presidential elector 1912-2024.
  1960 unpledged Alabama and Mississippi electors were elected unpledged and are not listed.
  Votes counted for Byrd in 1960: AL 6 + MS 8 unpledged + OK 1 faithless = 15.
- **Popular votes** (`popular-votes.csv`): base is the Wikipedia state tables (Leip data); for 1976-2024
  MIT EDSL values (CC0, doi:10.7910/DVN/42MVDX, `1976-2024-president.csv`) replace Wikipedia values in the
  states where doing so makes the candidate's national total equal the infobox/FEC total (`scripts/build.ts`;
  swaps: 1976 ME Carter, 1980 KY Carter, 1988 LA Dukakis, 2024 VA Trump/Harris). Wikipedia and MIT agree in
  1,571 of 1,734 candidate-state values (after the swaps) for 1976-2024; the remainder differ by usually under 0.2% of state
  totals (largest: 2012 and 2020 NY fusion-line counting, 2004 MS Bush; MIT also lacks some minor
  candidates) and were left on the Wikipedia/Leip value when national totals already matched.
  `scripts/check-pv.ts` and `scripts/check-mit.ts` print the comparisons.
  Known residual differences between summed states and the infobox national figure: 1920 (Harding -22,033,
  Cox -595, Debs +189), 1936 (Roosevelt +241, Landon +901), 1972 Schmitz +28, 1992 Bush +9 / Perot
  -1,581, 2016 Stein -2, 1976 Carter +10. State winners are not affected.
- 0 votes mean the candidate was not on the ballot (or, e.g., 1948 Alabama, the party's candidate appeared
  only as the Dixiecrat) - for example Taft 1912 California shows his 3,914 write-ins.
- Elector-slate states: 1960 Alabama uses the commonly cited Leip/Wikipedia figures (Kennedy 318,303 = highest
  Kennedy-pledged elector, unpledged slate 324,050 counted as `byrd`, Nixon 237,981); 1960 Mississippi and
  Louisiana unpledged votes are likewise counted as `byrd`; 1964 Alabama unpledged-slate votes (210,732, no
  Johnson on ballot) are not in the roster. Byrd's national popular total (610,409) is therefore the sum of
  unpledged-slate votes, not a true candidate total.
- 2024 values follow the current Wikipedia table (not yet final FEC totals) except VA, taken from MIT.
- **ME/NE districts** (`me-ne-districts.csv`): winner of each congressional district's elector from the
  Wikipedia tables (Maine 1972-2024, Nebraska 1992-2024). Where a page has no district rows (some early
  years) the district winner is the statewide winner, which is verified because all of the state's
  electoral votes went to one candidate.

### `state-totals.csv` (`year,state,total_votes`)

Total presidential votes cast in each state, for every candidate on the ballot, from the "State total"
column of the same Wikipedia tables (`scripts/build-totals.ts`). Where the listed roster candidates'
votes exceed that total (a few states where MIT EDSL values were swapped in), the listed sum is used.
The simulator counts `total_votes` minus the roster candidates as "Others", so candidates under 1%
nationally still count in each state's vote shares (e.g. McMullin in Utah 2016, the unpledged
elector slates in South Carolina 1956 and Alabama 1964).

## Judgement calls and uncertain values

- 1910-1930 and 1970/1980 apportionment populations are derived (see above), not copied from a table.
- Popular-vote disagreements between Wikipedia and MIT listed above are unresolved at state level.
- 1948 Tennessee: Truman 11, Thurmond 1 (elector Preston Parks); counted as faithless.
- 1912 California split 11 Roosevelt / 2 Wilson; 1916 West Virginia split 7 Hughes / 1 Wilson;
  both come from the table and are not faithless.
