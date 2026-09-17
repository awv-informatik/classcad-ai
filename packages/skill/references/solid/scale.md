# solid.scale

Scales a solid in place by a uniform factor relative to the **part coordinate system origin**. Size and position both change: an offset body moves further from (or closer to) the origin.

## Key Parameters (all required, code 1004 if omitted)

- `id` — entity injection feature ID (part ID → code 1001)
- `target` — solid ID; wrong type → 1001, invalid/consumed (e.g. a tool after a default boolean) → 1006
- `factor` — real number

## Return Value

The **target solid ID** (same ID), maxLevel=31, messages=[].

## Behavior

- **Uniform only** — no per-axis scale; use `common.transformObjectWithMatrix` for non-uniform scaling if available.
- **Center is the origin:** a body at `[100,0,0]` scaled 2x ends at `[200,0,0]`; a body centered at origin stays put. To scale around a body's own center: translate to origin → scale → translate back (same pattern as `solid.rotation`).
- **Cumulative/relative:** factor 2 then 3 = factor 6; no absolute "set scale". No `updateScale` — undo with 1/factor; for a specific total, compute the ratio current → desired.
- **factor=1** — silent no-op (returns ID, maxLevel=31).
- **factor=0 — silent no-op, NOT a collapse to a point:** success (maxLevel=31), body **unchanged** (bounding box, vertices, normals), later operations work normally. Special-cased; don't rely on it.
- **Very small non-zero factors (e.g. 0.0001) do scale** → degenerate geometry, undefined bounding box. Avoid.
- **Negative factors flip face normals — inside-out solid** (e.g. [0,0,-1] → [0,0,1]). A centered body at -1 keeps its bounding box; double -1 restores it. Can cause rendering artifacts and break booleans — use `solid.mirror` for mirroring.
- **No bounds:** 100 and 0.001 succeed; fractional factors (0.5, 1.5, 2.5, 0.333) work.
- Works on all solid types (box, sphere, cylinder, cone, extrusion, revolve, post-boolean compound).
- **Auto-scaling hides single-body scaling in snapshots** — include a fixed reference body when verifying visually.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"The parameter \"id\" has a wrong id type!"` | 1001 | Part ID instead of EIF ID |
| `"The parameter \"target\" has a wrong id type!"` | 1001 | Non-solid ID as target |
| `"An element of parameter \"target\" has an invalid id!"` | 1006 | Invalid or consumed solid ID |
| `"The parameter \"<id\|target\|factor>\" must be provided!"` | 1004 | Missing parameter |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })).result

// 2x in all dimensions — r.result === boxId, maxLevel 31
const r = await api.v1.solid.scale({ id: eifId, target: boxId, factor: 2 })

// Scale around the body's own center: to origin → scale → back
const box2 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [100, 0, 0] })).result
await api.v1.solid.translation({ id: eifId, target: box2, translation: [-100, 0, 0] })
await api.v1.solid.scale({ id: eifId, target: box2, factor: 2 })
await api.v1.solid.translation({ id: eifId, target: box2, translation: [100, 0, 0] })
```

## Related

`solid.translation` · `solid.rotation` · `solid.mirror` · `solid.copy`
