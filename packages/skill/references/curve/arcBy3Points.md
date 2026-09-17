# curve.arcBy3Points

Creates one or more circular arcs through start, mid and end points (in a `curve.shape`).

## Key Parameters (all required, no optional ones)

- `id` — shape ID (not part or EI)
- `startPos`, `midPos`, `endPos` — `[x, y, z]`, exactly 3 elements each (no 2D shorthand: `"If point is defined as array, it must have exactly 3 real values"`)

**`midPos` picks which of the two arcs is drawn:** above the chord → curves up, below → down. Swapping `startPos`/`endPos` does NOT flip the arc. The three points define the plane — fully 3D (XY, XZ, YZ or any plane), no normal needed.

## Return Value

VOID (null), maxLevel 31. No ID — arcs merge into the shape's geometry; no per-arc addressing, update or deletion (only `curve.deleteShape` / `curve.cleanShape`).

## Batch Creation

Pass an array of parameter objects (may mix shape IDs). Single VOID response; **errors are per-item** — valid arcs are still created, maxLevel reflects the worst error.

## Gotchas

- **CRITICAL: collinear points** (e.g. `(0,0,0)`, `(25,0,0)`, `(50,0,0)`) **give an internal error**, not a validation message: `"[Evaluation error in CurveAPI_v1.arcBy3Points::PROC:[Index 2 ausserhalb des Arraybereichs] not defined !]"` (German array-index error, maxLevel=51, code=0).
- **Coincident points** (start==mid, start==end, all equal) give the same error — point geometry is not validated.
- **No size limits:** tiny arcs (points ~0.002 apart) and nearly-full-circle arcs work.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1001 | `"...wrong id type! Provide only following id types: [\"shape\"]"` | Part/EI ID instead of shape ID |
| 1004 | `"The parameter \"<midPos\|startPos\|endPos\|id>\" must be provided..."` | Missing parameter |
| 1006 | `"An element of parameter \"id\" has an invalid id!"` | Non-existent or deleted shape ID |
| 0 | `"...Index 2 ausserhalb des Arraybereichs..."` | Collinear or coincident points |
| 0 | `"...must have exactly 3 real values"` | Point not exactly 3 elements |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'ArcPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Arcs' })).result

// Semicircle
await api.v1.curve.arcBy3Points({ id: shapeId, startPos: [0, 0, 0], midPos: [25, 25, 0], endPos: [50, 0, 0] })

// D-shaped profile: lines + arc
const d = (await api.v1.curve.shape({ id: eifId, name: 'D' })).result
await api.v1.curve.line({ id: d, startPos: [0, 100, 0], endPos: [0, 140, 0] })
await api.v1.curve.line({ id: d, startPos: [0, 140, 0], endPos: [30, 140, 0] })
await api.v1.curve.arcBy3Points({ id: d, startPos: [30, 140, 0], midPos: [50, 120, 0], endPos: [30, 100, 0] })
await api.v1.curve.line({ id: d, startPos: [30, 100, 0], endPos: [0, 100, 0] })

// Batch
await api.v1.curve.arcBy3Points([
  { id: shapeId, startPos: [100, 0, 0], midPos: [110, 15, 0], endPos: [120, 0, 0] },
  { id: shapeId, startPos: [130, 0, 0], midPos: [140, 15, 0], endPos: [150, 0, 0] },
])
```

## Related

`curve.shape` · `curve.arcByCenter` · `curve.arcByCenterRadAngle` · `curve.line` · `curve.deleteShape` / `curve.cleanShape`
