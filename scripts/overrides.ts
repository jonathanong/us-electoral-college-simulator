// Hand-entered corrections: faithless / abstaining electors absent from the Wikipedia state tables.
// Sources: NARA https://www.archives.gov/electoral-college/ (certificates, "faithless electors") and
// Wikipedia "Faithless elector". The Wikipedia state tables already count these votes for the
// candidate actually voted for in: 1948 TN, 1960 OK, 1968 NC, 1972 VA (verified by EV totals).
export interface Faithless {
  year: number
  state: string
  castFor: string
  pledgedTo: string
  count: number
  /** true when the Wikipedia table does not already include this vote */
  addToTable: boolean
}
const f = (
  year: number, state: string, castFor: string, pledgedTo: string, addToTable: boolean, count = 1,
): Faithless => ({ year, state, castFor, pledgedTo, count, addToTable })

export const FAITHLESS: Faithless[] = [
  f(1948, 'TN', 'thurmond', 'truman', false),
  f(1956, 'AL', 'jones', 'stevenson', true),
  f(1960, 'OK', 'byrd', 'nixon', false),
  f(1968, 'NC', 'wallace', 'nixon', false),
  f(1972, 'VA', 'hospers', 'nixon', false),
  f(1976, 'WA', 'reagan', 'ford', true),
  f(1988, 'WV', 'bentsen', 'dukakis', true),
  f(2000, 'DC', 'abstain', 'gore', true),
  f(2004, 'MN', 'edwards', 'kerry', true),
  f(2016, 'HI', 'sanders', 'clinton', true),
  f(2016, 'TX', 'kasich', 'trump', true),
  f(2016, 'TX', 'paul', 'trump', true),
  f(2016, 'WA', 'powell', 'clinton', true, 3),
  f(2016, 'WA', 'spottedeagle', 'clinton', true),
]
