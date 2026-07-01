# sketch.copyFrom

Copies all sketch geometry and constraints from one sketch to another.

## Prerequisites

- A part (`part.create`)
- Two sketches — source (`toCopyId`) and destination (`id`). Both must be sketch IDs (from `sketch.create` or `part.sketch`).

## Key Parameters

- **`id`** (required) — destination sketch ID. Receives the copied geometry.
- **`toCopyId`** (required) — source sketch ID. Geometry is read from here.

Both params must be sketch IDs. Passing a part ID or other object type → error 1001 with message naming the required type `["sketch"]`.

## Return Value

Always `null` (VOID). maxLevel 31 on success, no messages.

## Behavior

- **Merges, does not replace.** Destination keeps all existing geometry. Source geometry is added on top.
- **Copies constraints AND full dimensions.** Every constraint from the source is duplicated into the destination — verified live: fixation, coincident, parallel, perpendicular, horizontal, and radius constraints all doubled. There is no flag to control this (unlike `copyGeometry`'s `doCopyConstraints`). It also copies the **driving dimension annotation**, not just the constraint part: a `RADIUS` dimension gave `CC_2DRadiusConstraint` 1→2 **and** `CC_RadialFeatureDimension` 1→2 (+ a new per-sketch `CC_SketchDimensionSet`). This is stronger than `copyGeometry(doCopyConstraints:true)`, which copies the constraint but leaves the annotation behind. `copyFrom` is a genuine sketch merge.
- **No offset/translation.** Geometry is copied at the same positions as in the source. Use `copyGeometry` if you need an offset.
- **Self-copy is allowed.** Passing the same sketch ID for both `id` and `toCopyId` silently duplicates all elements on top of originals. No error, but likely not useful.
- **Empty source is a no-op.** result=null, maxLevel=31, no error.
- **Works across sketch types.** Feature sketches (`part.sketch`) and entity-injection sketches (`sketch.create`) can be freely mixed as source and destination.

## Gotchas

- No IDs of the copied elements are returned. If you need the new element IDs, use `copyGeometry` (with `doCopyConstraints: false`) instead.
- Self-copy produces duplicate overlapping geometry — don't do it by accident.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1001 | "The parameter \"id\" has a wrong id type! Provide only following id types: [\"sketch\"]" | Passed a non-sketch ID (e.g., part ID) as destination |
| 1001 | "The parameter \"toCopyId\" has a wrong id type! Provide only following id types: [\"sketch\"]" | Passed a non-sketch ID as source |
| 1006 | "An element of parameter \"toCopyId\" has an invalid id!" | Non-existent toCopyId |
| 1006 | "An element of parameter \"id\" has an invalid id!" | Non-existent destination id |

## Working Example

```js
const partId = (await api.v1.part.create({})).result

// Source sketch with geometry
const srcSk = (await api.v1.sketch.create({ id: partId })).result
await api.v1.sketch.rectangle({ id: srcSk, startPos: [0, 0, 0], endPos: [40, 30, 0] })
await api.v1.sketch.circle({ id: srcSk, centerPos: [60, 15, 0], radius: 10 })

// Destination sketch (can be empty or have existing geometry)
const dstSk = (await api.v1.sketch.create({ id: partId })).result

// Copy all geometry + constraints from source to destination
await api.v1.sketch.copyFrom({ id: dstSk, toCopyId: srcSk })
// dstSk now contains rectangle + circle at same positions as srcSk
```

## Related

- `sketch.copyGeometry` — copies specific elements within the same sketch, with translation offset and optional constraint control. Returns new IDs when `doCopyConstraints: false`.
- `sketch.loadFrom` — copies sketch geometry from an OFB file (by URL, path, or data) into a sketch.
- `sketch.moveGeometry` — moves elements instead of copying.
