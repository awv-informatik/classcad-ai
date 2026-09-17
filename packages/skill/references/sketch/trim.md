# sketch.trim

Removes staged segments produced by `preTrim` — **step 2** of `preTrim → trim → postTrim`. Pass the segment ids to discard; the rest survive into `postTrim`. See `preTrim.md` for staging and round-trip semantics (survivor ids, coalescing, Auto_Coinc).

## Key Parameters

```js
api.v1.sketch.trim({ id: skId, curveIds: [seg1, seg2] }) // VOID, maxLevel 31
```

- `id` — **sketch** id (wrong type → 1001, `["sketch"]`)
- `curveIds` — **staged segment ids from `preTrim.result[].splittedCurves[].id`** (wrong type → 1001, `["sketch-curve"]`). `getGeometry` mid-workflow shows only original ids.

## Behavior

- **Acts immediately.** A trimmed segment's id is **dead as soon as `trim` returns** (`getPositions` → mL51, before `postTrim`); `SplittedCurves` child count drops. The segment is **deleted** — not moved to `NoneSplitted`, not deferred.
- **Multi-segment, atomic, order-independent** (`[A,B]` ≡ `[B,A]`). Untrimmed siblings keep their ids until `postTrim`.
- **Disjoint survivors do NOT coalesce** — only *contiguous* survivors of a source do; trimming the middle leaves separate curves.
- **All segments of a source trimmed** → source fully removed after `postTrim`; crossing curves survive. Trim everything + `postTrim` → empty sketch (no leftover points, no container leak).
- **Arcs trim like lines** (circle arc segment: VOID, immediate death, survivor arc gets new id).
- **Solver-independent** — works on planeless sketches for line and arc segments.

## Validation

| Input | Result |
|---|---|
| `curveIds: []` | **safe no-op, mL31** (unlike `preTrim([])`, which means ALL) |
| missing `curveIds` / missing `id` | mL51 **1004** "must be provided" |
| wrong-type `id` (part/point) | mL51 **1001** `["sketch"]` |
| wrong-type `curveIds` element (sketch/point/constraint) | mL51 **1001** `["sketch-curve"]` |
| **duplicate `[s,s]`** | **mL51, NOT idempotent** — atomic, other segments untouched (preTrim accepts duplicates) |
| bogus / nonexistent id | **atomic mL51 1006**, valid segments untouched (preceding level-41 `ToId` warning observed for preTrim) |
| **dead** segment id (already trimmed, or killed by re-`preTrim`) | **mL51 1006** |
| real **but unstaged** curve id (original `sourceId`) | **silent per-element skip, mL31** — valid segments in the same call still trimmed |

**Rule:** dead/nonexistent id → whole call fails (1006). Real-but-unstaged id → silently ignored. Easy to think a trim worked when it removed nothing.

## Gotchas

- **`curveIds` resolve GLOBALLY, not scoped to `id`.** A segment from a *different* sketch is trimmed there (mL31). Same footgun as `splitCurve`.
- **Never reuse segment ids across a re-`preTrim`** — they die; trimming them is 1006.

## Scale / hang

Deprecated `trimCurves` once hung the worker (99% CPU, `kill -9`) at ~39 segments on a sketch with ~20 constraints + 20 dimensions. A bounded `trim` probe (N = 12/24/27 segments, light constraints, no manual dimensions) ran flat ~4–6 ms — no hang, no super-linear growth: the hang was **constraint-density-driven**. **Untested** (to protect the shared worker): `trim` with heavy constraints + 39+ segments — verify before relying on very large trims of heavily-constrained sketches.

## Working example

```js
const partId = (await api.v1.part.create({ name: 'P' })).result
const planeId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId })).result
const h = (await api.v1.sketch.line({ id: skId, startPos: [0, 50, 0], endPos: [100, 50, 0] })).result
await api.v1.sketch.line({ id: skId, startPos: [50, 0, 0], endPos: [50, 100, 0] })

const pre = await api.v1.sketch.preTrim({ id: skId })
const toRemove = pre.result.find(e => e.sourceId === h).splittedCurves.filter(s => s.interval[0] > 0).map(s => s.id)
await api.v1.sketch.trim({ id: skId, curveIds: toRemove }) // deleted immediately
await api.v1.sketch.postTrim({ id: skId })
```

## Related

`sketch.preTrim` · `sketch.postTrim` · `sketch.getPositions` · `~~sketch.trimCurves~~` (deprecated; many-segment worker hang — use `trim`)
