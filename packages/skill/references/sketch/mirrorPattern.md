# sketch.mirrorPattern

Mirrors a rigid set (or single geometry element) across a symmetry line. Always exactly one copy.

## Key Parameters

All required, none optional:

- `id` — sketch ID
- `rigidSetId` — rigid set ID **or** single geometry ID (auto-wrapped; `geometry[0]` is then a new rigid set ID)
- `symmetryLineId` — **must be a sketch line**; arcs, circles, etc. → 1001 (no non-linear axes)

## Return Value

`{ constraint, geometry }`, maxLevel 31. `geometry` is always `[originalRsId, copyRsId]`. **No `dimension` field** (unlike linear/circular) — no adjustable numeric parameter.

## Behavior

- Pure reflection: vertical line x=S maps (x, y) → (2S − x, y); horizontal y=S → (x, 2S − y); diagonals accordingly.
- **No update method** (`updateMirrorPattern` doesn't exist) — move the symmetry line to move the mirror, or delete the constraint and recreate.
- **Delete** via `sketch.deleteObject({ ids: [constraintId] })` — mirrored geometry survives independently (same as linear/circular).
- Symmetry line may also be a rigid-set member (mirrors onto itself, no error). Geometry lying on the line yields an exactly overlapping copy.
- Mirrored start/end points are geometric reflections, not index-preserving — ordering may reverse.
- One rigid set can be mirrored across several lines (independent constraints); `geometry[1]` can feed further mirror/pattern ops (chaining).

## Common Errors

- **1001** (level 51): `"The parameter \"symmetryLineId\" has a wrong id type! Provide only following id types: [\"sketch-line\"]"` — non-line axis.
- **1006** (level 51): `"An element of parameter \"symmetryLineId\" has an invalid id!"` — nonexistent/malformed ID.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result
const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [20, 0, 0] })).result
const l2 = (await api.v1.sketch.line({ id: skId, startPos: [20, 0, 0], endPos: [20, 15, 0] })).result
const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })).result
const symLine = (await api.v1.sketch.line({ id: skId, startPos: [40, -10, 0], endPos: [40, 30, 0] })).result

const r = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: rsId, symmetryLineId: symLine })
// r.result = { constraint, geometry: [originalRsId, copyRsId] }
```

## Related

`sketch.rigidSet` · `sketch.linearPattern` · `sketch.circularPattern` · `sketch.deleteObject` · `sketch.getGeometry`
