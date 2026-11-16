import type { Method, StateCode } from "./types.ts";

type Pops = ReadonlyMap<StateCode, number>;
type DivisorMethod = Exclude<Method, "hamilton">;

const DIVISORS: Record<DivisorMethod, (n: number) => number> = {
  "huntington-hill": (n) => Math.sqrt(n * (n + 1)),
  webster: (n) => n + 0.5,
  jefferson: (n) => n + 1,
};

/** Priority of a state's (n+1)th seat when it currently holds n seats. */
export function priority(pop: number, n: number, method: DivisorMethod): number {
  return pop / DIVISORS[method](n);
}

function assertSize(pops: Pops, size: number): void {
  if (!Number.isInteger(size) || size < pops.size) {
    throw new RangeError(`House size must be an integer of at least ${pops.size}, got ${size}`);
  }
}

function byPriorityThenCode(a: [StateCode, number], b: [StateCode, number]): number {
  return b[1] - a[1] || (a[0] < b[0] ? -1 : 1);
}

/**
 * Seats awarded after every state's guaranteed first seat, in priority order, up to `maxSize`.
 * Divisor methods are house-monotone, so the first `size - states` entries give any smaller House.
 */
export function seatSequence(pops: Pops, method: DivisorMethod, maxSize: number): StateCode[] {
  assertSize(pops, maxSize);
  const seats = new Map<StateCode, number>();
  const queue: [StateCode, number][] = [];
  for (const [state, pop] of pops) {
    seats.set(state, 1);
    queue.push([state, priority(pop, 1, method)]);
  }
  queue.sort(byPriorityThenCode);
  const order: StateCode[] = [];
  for (let i = pops.size; i < maxSize; i++) {
    const [state] = queue.shift()!;
    const n = seats.get(state)! + 1;
    seats.set(state, n);
    order.push(state);
    const next: [StateCode, number] = [state, priority(pops.get(state)!, n, method)];
    let lo = 0;
    let hi = queue.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (byPriorityThenCode(queue[mid]!, next) < 0) lo = mid + 1;
      else hi = mid;
    }
    queue.splice(lo, 0, next);
  }
  return order;
}

function hamilton(pops: Pops, size: number): Map<StateCode, number> {
  const total = [...pops.values()].reduce((a, b) => a + b, 0);
  const rows = [...pops].map(([state, pop]) => {
    const quota = (pop * size) / total;
    // A state whose quota is below one already got its fractional claim via the minimum seat.
    const rem = quota < 1 ? -1 : quota - Math.floor(quota);
    return { state, rem, seats: Math.max(1, Math.floor(quota)) };
  });
  let remaining = size - rows.reduce((a, r) => a + r.seats, 0);
  const order = rows.toSorted((a, b) => b.rem - a.rem || (a.state < b.state ? -1 : 1));
  for (const row of order) {
    if (remaining <= 0 || row.rem < 0) break;
    row.seats++;
    remaining--;
  }
  // Minimum-seat bumps can overshoot; take seats back from the weakest claims.
  while (remaining < 0) {
    const row = order.findLast((r) => r.seats > 1)!;
    row.seats--;
    remaining++;
  }
  return new Map(rows.map((r) => [r.state, r.seats]));
}

/** Apportion `size` seats among states, each guaranteed at least one. */
export function apportion(pops: Pops, size: number, method: Method): Map<StateCode, number> {
  assertSize(pops, size);
  if (method === "hamilton") return hamilton(pops, size);
  const seats = new Map<StateCode, number>([...pops.keys()].map((s) => [s, 1]));
  for (const state of seatSequence(pops, method, size)) seats.set(state, seats.get(state)! + 1);
  return seats;
}

/**
 * Seats DC would get if it were a state: the number of its Huntington-Hill priority values that
 * beat the last seat awarded among the states.
 */
export function seatsAsIfState(
  pop: number,
  pops: Pops,
  seats: ReadonlyMap<StateCode, number>,
): number {
  let threshold = Infinity;
  for (const [state, n] of seats) {
    if (n > 1)
      threshold = Math.min(threshold, priority(pops.get(state)!, n - 1, "huntington-hill"));
  }
  let n = 1;
  while (priority(pop, n, "huntington-hill") > threshold) n++;
  return n;
}
