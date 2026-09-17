# sketch.linearPattern

Patterns a rigid set (or single geometry element) in a linear/rectangular grid.

## Key Parameters

- `id` — sketch ID
- `rigidSetId` — rigid set ID **or** single geometry ID (auto-wrapped; `geometry[0]` is then a new rigid set ID)
- `xCount` / `yCount` (default 1) — total per axis **including the original** (`xCount: 3` = original + 2 copies; N copies → N+1). Need >1 on at least one axis for copies. Fractional → floored (`2.5` → 2). 0/negative → silent no-op: geometry has only the original, dimensions `[null, null]`, but a constraint node is still created.
- `xDistance` / `yDistance` (default 0) — neighbor spacing. Negative → copies in negative direction; zero → stacked (valid, useless).

## Return Value

`{ constraint, dimensions: [xDimId|null, yDimId|null], geometry }`, maxLevel 31.

- `geometry` — all rigid set IDs, original first; length `xCount × yCount`
- `dimensions[i]` — null when that axis is unused (count ≤ 1). Standard sketch dimensions: `sketch.updateDimension({ id: xDimId, value: 40 })`, no `openFeature`/`closeFeature`.

## Gotchas

- **Delete** via `sketch.deleteObject({ ids: [constraintId] })` — constraint and dimension nodes are removed; **copies survive** as independent geometry.
- **One root per drawing.** A second `part.create` is refused ("There is already a root assembly or part"); `common.clear()` first, or use part templates in an assembly.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result
const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [15, 0, 0] })).result
const l2 = (await api.v1.sketch.line({ id: skId, startPos: [15, 0, 0], endPos: [15, 10, 0] })).result
const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })).result

// 3×2 grid
const r = await api.v1.sketch.linearPattern({ id: skId, rigidSetId: rsId, xCount: 3, xDistance: 30, yCount: 2, yDistance: 25 })
// r.result.geometry.length === 6, dimensions = [xDimId, yDimId]
await api.v1.sketch.updateDimension({ id: r.result.dimensions[0], value: 50 })
```

## Related

`sketch.rigidSet` · `sketch.circularPattern` · `sketch.mirrorPattern` · `sketch.updateDimension` · `sketch.deleteObject`
