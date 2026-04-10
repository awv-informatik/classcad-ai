# sketch.mirrorPattern

Mirrors a rigid set (or single geometry element) across a symmetry line within a sketch. Always produces exactly one mirrored copy.

## Prerequisites

- A sketch (`sketch.create`)
- A rigid set (`sketch.rigidSet`) OR a single sketch geometry ID (line, arc, circle, etc.)
- A symmetry line — must be a **sketch line** ID (from `sketch.line`)

## Key Parameters

- `id` — sketch ID
- `rigidSetId` — rigid set ID **or** a single geometry ID (auto-wraps into a rigid set internally)
- `symmetryLineId` — ID of the mirror axis line. **Must be a sketch line** — arcs, circles, and other geometry types are rejected with error 1001.

All three parameters are required. There are no optional parameters.

## Return Value

```js
{
  constraint: id,        // pattern constraint node ID
  geometry: Array<id>    // exactly 2 rigid set IDs: [original, copy]
}
```

- `geometry.length` = 2 (always — there is no count parameter)
- `geometry[0]` = the original rigid set (or auto-created rigid set wrapping a single geometry)
- `geometry[1]` = the mirrored copy rigid set
- **No `dimension` or `dimensions` field** — unlike `linearPattern` and `circularPattern`
- maxLevel is 31 on success

## Gotchas

- **Only sketch lines work as symmetryLineId.** Arcs, circles, and other geometry types produce error 1001: `"The parameter \"symmetryLineId\" has a wrong id type! Provide only following id types: [\"sketch-line\"]"`. This differs from what you might expect — you cannot mirror across a non-linear axis.
- **No update method.** `updateMirrorPattern` does not exist. To change the mirror axis, delete the pattern constraint and recreate. The mirror is fully defined by the symmetry line's position — move the line to change the mirror.
- **No dimension returned.** Unlike linear/circular patterns which return dimension IDs for spacing/angle, mirror patterns have no adjustable numeric parameter.
- **Single geometry ID works as rigidSetId.** The API auto-wraps it. `geometry[0]` will be a new rigid set ID, not the original geometry ID.
- **Symmetry line can be part of the rigid set.** Using the same line as both a member of the rigid set and the symmetry axis succeeds without error. The line effectively mirrors onto itself.
- **Geometry on the symmetry line creates an overlapping copy.** No error or special handling — the copy sits exactly on top of the original.
- **Start/end points may swap.** Mirrored lines have start/end points that correspond to the originals' reflected positions, but the ordering may reverse (original start→copy start, but these are geometric reflections, not index-preserving).

## Coordinate Behavior

Mirror reflection is purely geometric. For a vertical symmetry line at x=S, each point (x, y) maps to (2S - x, y). For a horizontal line at y=S, each point maps to (x, 2S - y). Diagonal lines reflect accordingly.

## Multiple Mirrors

- The same rigid set can be mirrored across multiple different symmetry lines. Each produces an independent pattern with its own constraint.
- Mirrored copies (`geometry[1]`) can be used as `rigidSetId` for further mirror or pattern operations (chaining).

## Deleting a Pattern

Use `sketch.deleteObject({ ids: [constraintId] })` to remove the pattern constraint. Mirrored geometry survives as independent sketch geometry. Consistent with linear/circular pattern behavior.

## Common Errors

- **Wrong ID type** (code 1001, level 51): `"The parameter \"symmetryLineId\" has a wrong id type! Provide only following id types: [\"sketch-line\"]"` — caused by passing an arc, circle, or other non-line geometry as the symmetry line.
- **Invalid ID** (code 1006, level 51): `"An element of parameter \"symmetryLineId\" has an invalid id!"` — the symmetry line ID doesn't exist or is malformed.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create geometry on the left side
const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [20, 0, 0] })).result
const l2 = (await api.v1.sketch.line({ id: skId, startPos: [20, 0, 0], endPos: [20, 15, 0] })).result

// Group into rigid set
const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2] })).result

// Create vertical symmetry line at x=40
const symLine = (await api.v1.sketch.line({ id: skId, startPos: [40, -10, 0], endPos: [40, 30, 0] })).result

// Mirror
const r = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: rsId, symmetryLineId: symLine })
// r.result.constraint = pattern constraint ID
// r.result.geometry = [originalRsId, copyRsId]
```

## Related

- `sketch.rigidSet` — create the rigid set input
- `sketch.linearPattern` — pattern in X/Y grid (has count/distance parameters)
- `sketch.circularPattern` — pattern around a center point (has angle/count parameters)
- `sketch.deleteObject` — delete the pattern constraint (preserves geometry)
- `sketch.getGeometry` — inspect member geometry inside the copy rigid set
