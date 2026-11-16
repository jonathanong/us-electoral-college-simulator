// Build candidates, electoral-votes, faithless, popular-votes, me-ne-districts CSVs from raw.json.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { cacheDir } from './fetch.ts'
import { CANDS } from './candidates.ts'
import { FAITHLESS } from './overrides.ts'
import { toCsv } from './csv.ts'
import { loadMit } from './mit.ts'
import { loadRefs } from './refs.ts'
import type { Area } from './build-raw.ts'

const OUT = new URL('../data/csv/', import.meta.url).pathname
const raw = JSON.parse(readFileSync(join(cacheDir, 'raw.json'), 'utf8')) as Record<string, Record<string, Area>>
const mit = loadMit()
const refs = loadRefs()
const log: string[] = []
const ev: (string | number)[][] = []
const pv: (string | number)[][] = []
const dist: (string | number)[][] = []

/**
 * Popular votes start from the Wikipedia (Leip-derived) state tables. Where a candidate's national sum
 * differs from the reference national total (infobox / FEC), swap in MIT EDSL values for a subset of
 * differing states whose swap exactly closes the gap. Unresolved gaps are logged.
 */
function resolvePv(year: number, ids: string[]): void {
  for (const id of ids) {
    const rows = pv.filter((r) => r[0] === year && r[2] === id)
    const ref = refs[year]?.[id]
    const wsum = rows.reduce((s, r) => s + (r[3] as number), 0)
    if (ref === undefined) log.push(`${year} ${id} no reference total; wiki sum ${wsum} kept`)
    if (ref === undefined || ref === wsum) continue
    const diffs = rows
      .map((r) => ({ r, m: mit[year]?.[r[1] as string]?.votes[id] ?? 0 }))
      .filter((d) => d.m > 0 && (d.r[3] as number) > 0 && d.m !== d.r[3])
    const need = ref - wsum
    const pick = (i: number, left: number, chosen: typeof diffs): typeof diffs | null => {
      if (left === 0) return chosen
      if (i >= diffs.length) return null
      const d = diffs[i]
      return pick(i + 1, left - (d.m - (d.r[3] as number)), [...chosen, d]) ?? pick(i + 1, left, chosen)
    }
    const hit = diffs.length <= 22 ? pick(0, need, []) : null
    if (!hit) {
      log.push(`${year} ${id} UNRESOLVED wiki sum ${wsum} ref ${ref} (${need})`)
      continue
    }
    for (const d of hit) {
      log.push(`${year} ${d.r[1]} ${id} wiki=${d.r[3]} -> mit=${d.m}`)
      d.r[3] = d.m
    }
  }
}

for (const year of Object.keys(raw).map(Number)) {
  const states = raw[year]
  const cands = CANDS.filter((c) => c.year === year)
  for (const st of Object.keys(states).sort()) {
    const a = states[st]
    const votes = { ...a.ev }
    for (const x of FAITHLESS.filter((x) => x.year === year && x.state === st)) {
      if (x.addToTable) {
        if (votes[x.castFor]) throw new Error(`already present ${year} ${st} ${x.castFor}`)
        votes[x.castFor] = x.count
      } else if ((votes[x.castFor] ?? 0) < x.count) throw new Error(`missing ${year} ${st} ${x.castFor}`)
    }
    for (const [id, n] of Object.entries(votes).sort((p, q) => q[1] - p[1]))
      if (n > 0) ev.push([year, st, id, n])
    for (const c of cands.filter((c) => c.m)) {
      pv.push([year, st, c.id, a.pv[c.id] ?? 0])
    }
  }
  resolvePv(year, cands.filter((c) => c.m).map((c) => c.id))
  for (const st of ['ME', 'NE']) {
    if ((st === 'ME' && year < 1972) || (st === 'NE' && year < 1992)) continue
    const a = states[st]
    for (const d of [1, 2, 3]) {
      if (st === 'ME' && d === 3) continue
      let winner: string
      const cell = a.dist[d]
      if (cell) {
        const w = Object.entries(cell.ev).filter(([, n]) => n > 0)
        if (w.length !== 1 || w[0][1] !== 1) throw new Error(`bad district ${year} ${st}${d}`)
        winner = w[0][0]
      } else {
        const w = Object.entries(a.ev).filter(([, n]) => n > 0)
        if (w.length !== 1) throw new Error(`no district rows and split EV ${year} ${st}`)
        winner = w[0][0]
      }
      dist.push([year, st, d, winner])
    }
  }
}

const fl = FAITHLESS.map((x) => [x.year, x.state, x.castFor, x.pledgedTo, x.count])
const cands = CANDS.map((c) => [c.year, c.id, c.name, c.party])
writeFileSync(OUT + 'candidates.csv', toCsv(['year', 'candidate', 'name', 'party'], cands))
writeFileSync(OUT + 'electoral-votes.csv', toCsv(['year', 'state', 'candidate', 'electoral_votes'], ev))
writeFileSync(OUT + 'faithless.csv', toCsv(['year', 'state', 'cast_for', 'pledged_to', 'count'], fl))
writeFileSync(OUT + 'popular-votes.csv', toCsv(['year', 'state', 'candidate', 'votes'], pv))
writeFileSync(OUT + 'me-ne-districts.csv', toCsv(['year', 'state', 'district', 'winner'], dist))
writeFileSync(join(cacheDir, 'pv-decisions.txt'), log.join('\n') + '\n')
console.log({ cands: cands.length, ev: ev.length, pv: pv.length, fl: fl.length, dist: dist.length })
