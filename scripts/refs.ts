// National popular-vote reference totals scraped from each page's infobox ticket box (wikitext).
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { cacheDir } from './fetch.ts'
import { CANDS } from './candidates.ts'

export function loadRefs(): Record<number, Record<string, number>> {
  const out: Record<number, Record<string, number>> = {}
  for (let year = 1912; year <= 2024; year += 4) {
    const f = join(cacheDir, `${year}_United_States_presidential_election.txt`)
    if (!existsSync(f)) continue
    const boxes = [...readFileSync(f, 'utf8').matchAll(/ticket box row\|([^\n]*)/g)].map((m) => m[1])
    for (const c of CANDS.filter((c) => c.year === year && c.m)) {
      const sur = c.name.split(' ').pop()!
      const b = boxes.find((x) => /name\s*=/.test(x) && x.split(/\bpv\b/)[0].includes(sur))
      const m = b && /pv\s*=\s*([\d,]+)/.exec(b)
      if (m) (out[year] ??= {})[c.id] = Number(m[1].replace(/,/g, ''))
    }
  }
  return out
}
