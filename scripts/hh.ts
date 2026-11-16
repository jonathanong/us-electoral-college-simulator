// Huntington-Hill (equal proportions) apportionment: priority = pop / sqrt(n(n+1)), 1 seat minimum.
export function huntingtonHill(pops: Record<string, number>, seats: number): Record<string, number> {
  const out: Record<string, number> = {}
  for (const k of Object.keys(pops)) out[k] = 1
  let left = seats - Object.keys(pops).length
  while (left-- > 0) {
    let best = ''
    let bp = -1
    for (const [k, p] of Object.entries(pops)) {
      const pr = p / Math.sqrt(out[k] * (out[k] + 1))
      if (pr > bp) {
        bp = pr
        best = k
      }
    }
    out[best]++
  }
  return out
}
