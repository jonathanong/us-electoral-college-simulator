// Build per-year raw state results (EV + popular vote per roster candidate) from the cached pages.
// Output: $TMPDIR/edata/raw.json  {year: {ST: {ev:{id:n}, pv:{id:n}, dist:{1:{ev,pv}}}}}
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { cacheDir } from './fetch.ts'
import { extract } from './extract.ts'
import { CANDS } from './candidates.ts'
import { parseArea } from './states.ts'

type Cell = { ev: Record<string, number>; pv: Record<string, number>; sum?: number; total?: number }
export type Area = Cell & { dist: Record<number, Cell> }
const out: Record<number, Record<string, Area>> = {}

for (let year = 1912; year <= 2024; year += 4) {
  const raw = extract(year)
  const cands = CANDS.filter((c) => c.year === year && c.m)
  const res: Record<string, Area> = (out[year] = {})
  const natPv: Record<string, number> = {}
  let natAll = 0
  const unmatched: string[] = []
  raw.groups.forEach((g, i) => {
    if (!cands.some((c) => c.m!.test(g.label))) unmatched.push(g.label)
    void i
  })
  for (const row of raw.rows) {
    const a = parseArea(row.state)
    if (!a) {
      if (!/^(Totals?|U\.S\.|Source)/i.test(row.state)) console.log(year, 'skip row', row.state)
      continue
    }
    const cell: Cell = { ev: {}, pv: {} }
    raw.groups.forEach((g, i) => {
      const c = cands.find((x) => x.m!.test(g.label))
      if (!c) return
      if (cell.ev[c.id] !== undefined) throw new Error(`dup match ${year} ${c.id} ${g.label}`)
      cell.ev[c.id] = row.ev[i] ?? 0
      cell.pv[c.id] = row.votes[i] ?? 0
    })
    const total = raw.groups.reduce((s, _, i) => s + (row.votes[i] ?? 0), 0)
    cell.sum = total
    cell.total = row.total ?? 0
    if (a.district === undefined) natAll += total
    if (a.district === undefined)
      for (const k of Object.keys(cell.pv)) natPv[k] = (natPv[k] ?? 0) + cell.pv[k]
    const e = (res[a.st] ??= { ev: {}, pv: {}, dist: {} })
    if (a.district) e.dist[a.district] = cell
    else {
      e.ev = cell.ev
      e.pv = cell.pv
      e.sum = cell.sum
      e.total = cell.total
    }
  }
  for (const [st, e] of Object.entries(res))
    for (const d of Object.values(e.dist))
      for (const [k, v] of Object.entries(d.ev)) e.ev[k] = (e.ev[k] ?? 0) + v
  const miss = cands.filter((c) => !raw.groups.some((g) => c.m!.test(g.label))).map((c) => c.id)
  console.log(year, 'states', Object.keys(res).length, 'unmatched cols:', unmatched.join(' | '), 'missing:', miss.join(','))
  const share = Object.entries(natPv).map(([k, v]) => `${k}:${((100 * v) / natAll).toFixed(2)}`)
  console.log('   share', share.join(' '))
}
writeFileSync(join(cacheDir, 'raw.json'), JSON.stringify(out))
