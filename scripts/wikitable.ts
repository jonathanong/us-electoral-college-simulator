// Minimal HTML table extractor for cached Wikipedia pages: expands colspan/rowspan into grids.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cacheDir } from './fetch.ts'

export type Grid = string[][]

const clean = (s: string): string =>
  s
    .replace(/<sup[^>]*>.*?<\/sup>/gs, '')
    .replace(/<style.*?<\/style>/gs, '')
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&#160;|&nbsp;/g, ' ')
    .replace(/&#91;.*?&#93;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\u00ad/g, '')
    .replace(/\s+/g, ' ')
    .trim()

export function parseTable(html: string): Grid {
  const grid: Grid = []
  const pending: Record<number, { left: number; text: string }>[] = []
  const rows = html.match(/<tr[\s>].*?<\/tr>/gs) ?? []
  rows.forEach((row, r) => {
    grid[r] ??= []
    pending[r] ??= {}
    let c = 0
    const place = (text: string, cs: number, rs: number) => {
      while (pending[r][c]) {
        grid[r][c] = pending[r][c].text
        c++
      }
      for (let i = 0; i < cs; i++) {
        grid[r][c + i] = text
        for (let k = 1; k < rs; k++) {
          pending[r + k] ??= {}
          pending[r + k][c + i] = { left: rs - k, text }
        }
      }
      c += cs
    }
    for (const m of row.matchAll(/<t[dh]([^>]*)>(.*?)<\/t[dh]>/gs)) {
      const cs = Number(/colspan="?(\d+)/.exec(m[1])?.[1] ?? 1)
      const rs = Number(/rowspan="?(\d+)/.exec(m[1])?.[1] ?? 1)
      place(clean(m[2]), cs, rs)
    }
    while (pending[r][c]) {
      grid[r][c] = pending[r][c].text
      c++
    }
  })
  return grid
}

export function loadPage(title: string): string {
  return readFileSync(join(cacheDir, `${title}.html`), 'utf8')
}

/** All top-level-ish tables (non-nested approximation: innermost tables). */
export function tables(html: string): string[] {
  return html.match(/<table[^>]*>(?:(?!<table).)*?<\/table>/gs) ?? []
}
