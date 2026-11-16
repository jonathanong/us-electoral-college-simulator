// Build data/csv/apportionment-population.csv.
//  1990-2020: exact figures from Census Bureau apportionment tables (pdftotext of the PDFs, see SOURCES.md).
//  1910-1980: apportionment population = resident population when the Census table's "Average
//  Apportionment Population Per Representative" x seats agrees with it (to rounding); otherwise
//  avg x seats (accurate to +/- seats/2 persons; the published average is rounded to an integer).
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { cacheDir } from './fetch.ts'
import { readCsv, toCsv } from './csv.ts'
import { STATES } from './states.ts'

const FILE = new URL('../data/csv/', import.meta.url).pathname
const n = (s: string) => Number(s.replace(/,/g, ''))
const out: (string | number)[][] = []

for (const y of [1990, 2000, 2010, 2020]) {
  const txt = readFileSync(join(cacheDir, `a${y}.txt`), 'utf8')
  let k = 0
  for (const line of txt.split('\n')) {
    const m = /^\s*([A-Z][A-Za-z ]+?)\s+([\d,]{6,})\s+\d+\s+/.exec(line)
    if (m && STATES[m[1]]) (out.push([y, STATES[m[1]], n(m[2])]), k++)
  }
  if (k !== 50) throw new Error(`${y}: parsed ${k} states`)
}

const approx: string[] = []
for (const r of readCsv(FILE + 'census-apportionment.csv')) {
  const st = STATES[r.Name]
  const census = Number(r.Year)
  if (!st || (census >= 1990 && st !== 'DC')) continue
  const res = n(r['Resident Population'])
  const reps = r['Number of Representatives'] ? n(r['Number of Representatives']) : 0
  const avg = r['Average Apportionment Population Per Representative']
  if (!reps || !avg) {
    // territory rows used for counterfactuals: AZ/NM 1910, AK/HI 1950 (resident population)
    if ((census === 1910 && ['AZ', 'NM'].includes(st)) || (census === 1950 && ['AK', 'HI'].includes(st)))
      out.push([census, st, res])
    else if (st !== 'DC') console.log('no seats/avg, skipped', census, st)
  } else if (st === 'DC') continue
  else {
    const est = n(avg) * reps
    if (Math.abs(est - res) <= reps / 2 + 0.5) out.push([census, st, res])
    else (out.push([census, st, est]), approx.push(`${census}:${st}`))
  }
  if (st === 'DC' && census >= 1960) out.push([census, 'DC', res])
}
out.sort((a, b) => (a[0] as number) - (b[0] as number) || String(a[1]).localeCompare(String(b[1])))
writeFileSync(FILE + 'apportionment-population.csv', toCsv(['census', 'state', 'apportionment_population'], out))
const byCensus: Record<string, number> = {}
for (const a of approx) byCensus[a.slice(0, 4)] = (byCensus[a.slice(0, 4)] ?? 0) + 1
console.log('rows', out.length, 'estimated (avg x seats) per census:', JSON.stringify(byCensus))
