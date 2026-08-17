# sketch.deleteObject

Deletes one or more sketch objects — geometry (lines, circles, arcs, points), constraints, dimensions, sketch regions, or rigid sets.

## Prerequisites

- A part (`part.create`)
- A sketch (`sketch.create`)
- Valid IDs of objects to delete

## Key Parameters

- **`ids`** (required) — array of IDs to delete. Accepts mixed types in a single call (geometry + constraints + dimensions + regions + rigid sets all at once).

## Return Value

- `result: null` (VOID) on success.
- `maxLevel: 31` on success (even with empty `ids` array).
- `maxLevel: 51` on error (invalid/nonexistent IDs).

## Cascading Behavior (verified 2026-07-01)

**Geometry deletion cascades to dependent objects:**
- Deleting a line/circle/arc **auto-deletes its child points AND every constraint/dimension that references it** — no orphans. Verified: deleting one of two perpendicular joined lines removed the line, both its points, and its coincident/horizontal/perpendicular constraints plus the distance constraint *and* its `CC_LinearFeatureDimension`; only the surviving line's own vertical constraint remained. Attempting to delete the now-gone constraint/dimension returns maxLevel=51 "invalid id".
- (Contrast: orphan points come from the **trim** workflow — trimming a circle down to arcs can leave its center point behind — NOT from `deleteObject`, which removes a geometry element's points with it.)

**Non-geometry deletion does NOT cascade:**
- Deleting a **constraint** or **dimension** — underlying geometry is preserved.
- Deleting a **sketch region** — underlying geometry (lines, arcs, etc.) is preserved. Only the region object is removed.
- Deleting a **rigid set** — underlying geometry is preserved. Only the grouping is removed.
- Deleting a **pattern constraint** — ALL geometry persists (original + copies). The pattern relationship is broken but circles/lines remain as independent elements.

**Pattern source geometry:**
- Deleting the source geometry of a pattern removes only that element. Pattern copies survive as independent geometry.

## Edge Cases

- **Empty `ids: []`** — silent no-op. Returns maxLevel=31, no error.
- **Invalid/nonexistent ID** — maxLevel=51 with WARNING "ToId()/TOID() didn't get an existing or valid id" (level 41) + ERROR "An element of parameter ids has an invalid id!" (code 1006, level 51).
- **Double-delete** (deleting an already-deleted ID) — same error as invalid ID (code 1006, maxLevel=51).
- **Passing `null` as an ID** — maxLevel=51 with "An element of parameter ids has the wrong type!" (code 1001). This happens when you pass the result of a failed creation call.

## Gotchas

- The `ids` parameter is an array, not a single ID. Always wrap in `[...]`.
- There is no undo — deletion is permanent within the session.
- **Multi-delete is ALL-OR-NOTHING (verified 2026-07-01).** If ANY id in the array is invalid, the entire call is rejected and **nothing is deleted** — not even the valid ids. Verified: `deleteObject([validE, 999999, validF])` left both E and F intact and returned code 1006. So **filter out invalid/`null` ids before calling** (e.g. `.filter(Boolean)`); a single stale id from a failed create silently blocks the whole batch.

## Working Example

```js
const partId = (await api.v1.part.create({})).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create geometry
const line = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
const circ = (await api.v1.sketch.circle({ id: skId, centerPos: [80, 30, 0], radius: 15 })).result

// Delete both at once
const r = await api.v1.sketch.deleteObject({ ids: [line, circ] })
// r.result = null, r.maxLevel = 31
```

## Related

- `sketch.deleteSketch` — deletes an entire sketch (not individual objects within it)
- `sketch.getGeometry` — verify what remains after deletion
- `sketch.constraint` / `sketch.dimension` — objects that cascade-delete when their geometry is removed
