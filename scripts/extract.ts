// Extract per-state results from Wikipedia election pages into a raw JSON per year.
import { loadPage, parseTable, tables, type Grid } from './wikitable.ts'

export interface Group {
  label: string
  ev: number
  votes: number
}
export interface Raw {
  year: number
  groups: Group[]
  rows: { state: string; ev: (number | null)[]; votes: (number | null)[]; total: number | null }[]
  header: string[][]
}

const num = (s: string | undefined): number | null => {
  if (s === undefined) return null
  const t = /^[^\d]*(\d[\d,]*)(?!\d)/.exec(s)?.[1]
  if (!t || /^[^\d]*\d[\d,]*\./.test(s)) return null
  return Number(t.replace(/,/g, ''))
}

export function findTable(year: number): Grid {
  const cands = tables(loadPage(`${year}_United_States_presidential_election`))
    .filter((t) => /Alabama/.test(t) && /Wyoming/.test(t))
    .map(parseTable)
    .filter((g) => g.length >= 50)
  return cands.sort((a, b) => b.length - a.length)[0]
}

export function extract(year: number): Raw {
  const g = findTable(year)
  const first = g.findIndex((r) => r[0] === 'Alabama')
  const header = g.slice(0, first)
  const groups: Group[] = []
  const hdr = header.slice(0, -1)
  const top = hdr
    .map((h) => ({ h, n: new Set(h.filter((x) => x)).size }))
    .sort((a, b) => b.n - a.n)[0].h
  const sub = header[header.length - 1]
  const width = Math.max(...g.map((r) => r.length))
  for (let c = 1; c < width; c++) {
    const label = top[c]
    if (!label || /^(Margin|State total|Total|Swing|EV$)/i.test(label)) continue
    if (groups.some((x) => x.label === label)) continue
    const cols: number[] = []
    for (let k = c; k < width && top[k] === label; k++) cols.push(k)
    const role = (re: RegExp) =>
      cols.find((k) => re.test(sub[k] ?? '')) ?? -1
    if (role(/^#$|^votes?$|^popular|^count/i) < 0) continue
    groups.push({
      label,
      ev: role(/elec|^E$|^EV$/i),
      votes: role(/^#$|^votes?$|^popular|^count/i),
    })
  }
  const rows = g
    .slice(first)
    .filter((r) => r[0] && !/^(Total|Totals|U\.S\.|Source)/i.test(r[0]) && r[0].length < 70)
    .map((r) => ({
      state: r[0],
      ev: groups.map((x) => (x.ev < 0 ? null : num(r[x.ev]))),
      votes: groups.map((x) => (x.votes < 0 ? null : num(r[x.votes]))),
      total: num(r[top.findIndex((l) => /State total|Total votes/i.test(l))]),
    }))
  return { year, groups, rows, header }
}

if (process.argv[1]?.endsWith('extract.ts')) {
  const year = Number(process.argv[2])
  const raw = extract(year)
  console.log(raw.header.map((h) => JSON.stringify(h.slice(0, 12))).join('\n'))
  console.log(raw.groups)
  console.log('rows', raw.rows.length, raw.rows.map((r) => r.state).join('|'))
  raw.groups.forEach((gp, i) => {
    const ev = raw.rows.reduce((s, r) => s + (r.ev[i] ?? 0), 0)
    const v = raw.rows.reduce((s, r) => s + (r.votes[i] ?? 0), 0)
    console.log(gp.label.padEnd(50), 'EV', ev, 'votes', v)
  })
}
