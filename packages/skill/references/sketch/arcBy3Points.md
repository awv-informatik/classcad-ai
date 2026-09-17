# sketch.arcBy3Points

Creates one or more arcs from start, mid, and end positions. The three points define a unique circle; the arc is the part of it passing through `midPos`.

## Key Parameters

- **`id`** (required) — sketch ID (part ID → 1001)
- **`startPos`**, **`endPos`**, **`midPos`** (required) — `[x, y, 0]`; non-zero Z → 1014
- **`midPos`** must lie ON the desired arc — not a curvature hint. It selects both the circle (different midPos → different radius/center) and which arc (minor vs major).
- **`genFixation`** (optional, default TRUE) — "Auto_Fix" **only when a point is at origin**
- **`genIncidence`** (optional, default TRUE) — "Auto_Coinc" when an endpoint **exactly matches** an existing point
- **`genTangency`** (optional, default FALSE) — `CC_2DTangentSketchConstraint` for adjacency to **another arc or circle** only — NOT line-to-arc, even when geometrically tangent
- **`isConstruction`** (optional, default FALSE) — construction geometry (dashed): in the solver as reference, excluded from operations; construction-only curves in `part.extrusion`/`part.revolve`/`part.twist` → error (maxLevel 51), no solid. See `recipes/constrained-sketching` (§ Construction geometry).

## Param-name trap

The third point is **`midPos`** in BOTH sketch and curve domains. Invented names (`passagePos`, `pointPos`, …) are **silently ignored** — the call fails with null for missing `midPos`, and the script layer offers no typo suggestion (it validates method names, not param names).

## Internal Representation

Same `CC_CircularArc` node as `arcByCenter` (server computes the center): arc + 3 child points (end, start, center), same queries (`getPositions` → `{ startPos, endPos, centerPos }` incl. computed center; `getPoints` → `{ startId, endId, centerId }`; `getGeometry` → `arcs`), same `deleteObject` (null, maxLevel 31; queries on the deleted arc → null, maxLevel 51).

## Direction & bulge

Tree bulge (`members.bulge.value` = tan(signedSweep/4), positive = CCW, sketch-local) follows from `midPos`'s side: apex-above semicircle → −1.0 (≡ `arcByCenter` cw=true); minor arc via 45° midpoint → +0.4142 (≡ cw=false). This makes arcBy3Points the **flag-free way to build arcs** — the complement only results from placing `midPos` on the wrong side. Direction is fixed at creation (`updateGeometry` ignores `isClockwise`).

## Return Value

`result: id | VOID | Array<id|VOID>`. Success: ID, maxLevel 31, no messages. Failure: null, maxLevel 51. **Batch error isolation:** invalid entries return null while valid ones succeed, e.g. `[58, null, 70]` with a collinear middle entry.

## Updating

- `arcsBy3Points: [{ id, startPos, endPos, midPos }]` — moving `midPos` [20,20]→[20,10] on a 0→40 arc moves the center to [20,−15].
- `arcsByCenter: [{ id, startPos, centerPos, endPos }]` also works.

## Common Errors

| Error | Code | Level | Cause |
|---|---|---|---|
| "startPos which is a 2D point, must have a z-value of 0!" | 1014 | 51 | Non-zero Z |
| "Invalid arc parameters" | 0 | 51 | Any degenerate config: collinear, start==mid, start==end, all identical |
| "The parameter \"id\" has a wrong id type! Provide only following id types: [\"sketch\"]" | 1001 | 51 | Part ID instead of sketch ID |
| "The parameter \"midPos\" must be provided in the api call!" | 1004 | 51 | Missing (or misnamed) midPos |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

const [arcId] = (await api.v1.sketch.arcBy3Points([
  { id: skId, startPos: [0, 0, 0], midPos: [20, 20, 0], endPos: [40, 0, 0] },
  { id: skId, startPos: [0, -40, 0], midPos: [20, -20, 0], endPos: [40, -40, 0] },
])).result

const pos = (await api.v1.sketch.getPositions({ id: arcId })).result // centerPos {x:20,y:0,z:0}

await api.v1.sketch.updateGeometry({
  id: skId,
  arcsBy3Points: [{ id: arcId, startPos: [0, 0, 0], midPos: [20, 10, 0], endPos: [40, 0, 0] }],
})
```

## Related

`sketch.arcByCenter` · `sketch.circle` · `sketch.getPositions` · `sketch.getPoints` · `sketch.getGeometry` · `sketch.updateGeometry` · `sketch.deleteObject` · `sketch.sketchRegion`
