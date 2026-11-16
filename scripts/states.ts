export const STATES: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  "District of Columbia": "DC",
  "D.C.": "DC",
  "D. C.": "DC",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

/** Normalise a results-table row label to {st, district?}; null if not a state row. */
export function parseArea(label: string): { st: string; district?: number } | null {
  const d = /^(ME|NE)[- ]?(\d)/.exec(label) ?? /^(Maine|Nebraska)(?:'s |[- ])(\d)/.exec(label);
  if (d) return { st: d[1].startsWith("N") ? "NE" : "ME", district: Number(d[2]) };
  const name = label
    .replace(/Tooltip.*$/, "")
    .replace(/District of ColumbiaDistrict of Columbia/, "District of Columbia")
    .replace(/[^A-Za-z. ]/g, "")
    .replace(/\b(at.large|AL)\b/i, "")
    .trim();
  const st = STATES[name];
  return st ? { st } : null;
}
