// Fetch rendered Wikipedia page HTML (MediaWiki parse API) into a cache dir ($TMPDIR/edata).
// Usage: NODE_USE_ENV_PROXY=1 node scripts/fetch.ts Title_One Title_Two ...  (underscored titles)
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export const cacheDir = join(process.env.EDATA_DIR ?? process.env.TMPDIR ?? '/tmp', 'edata')
const headers = { 'User-Agent': 'election-data-builder/1.0' }

export async function fetchHtml(title: string): Promise<string> {
  const q = `action=parse&page=${encodeURIComponent(title)}&prop=text&format=json&formatversion=2`
  const res = await fetch(`https://en.wikipedia.org/w/api.php?${q}`, { headers })
  if (!res.ok) throw new Error(`${res.status} for ${title}`)
  return ((await res.json()) as { parse: { text: string } }).parse.text
}

if (process.argv[1]?.endsWith('fetch.ts')) {
  mkdirSync(cacheDir, { recursive: true })
  for (const t of process.argv.slice(2)) {
    const f = join(cacheDir, `${t}.html`)
    if (existsSync(f)) continue
    try {
      await new Promise((r) => setTimeout(r, 4000))
      const html = await fetchHtml(t)
      writeFileSync(f, html)
      console.log(t, html.length)
    } catch (e) {
      console.log('FAIL', t, String(e))
    }
  }
}
