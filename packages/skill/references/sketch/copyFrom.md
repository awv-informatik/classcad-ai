# sketch.copyFrom

Copies all geometry and constraints from one sketch into another — a genuine sketch merge.

## Key Parameters

- **`id`** (required) — destination sketch
- **`toCopyId`** (required) — source sketch

Both must be sketch IDs (else 1001, `["sketch"]`). Feature sketches (`part.sketch`) and entity-injection sketches (`sketch.create`) mix freely.

## Return Value

VOID, maxLevel 31, no messages. No IDs of copied elements — use `copyGeometry` (`doCopyConstraints: false`) when you need them.

## Behavior

- **Merges, does not replace**; copies at the same positions (no offset — use `copyGeometry` for that).
- **Copies ALL constraints AND dimension annotations**, no flag to disable: fixation, coincident, parallel, perpendicular, horizontal, radius all doubled; a `RADIUS` dimension gave `CC_2DRadiusConstraint` 1→2 **and** `CC_RadialFeatureDimension` 1→2 (+ a new per-sketch `CC_SketchDimensionSet`). Stronger than `copyGeometry(doCopyConstraints:true)`, which leaves the annotation behind.
- **Self-copy** (`id === toCopyId`) silently duplicates everything on top of the originals — don't do it by accident.
- **Empty source** → no-op (null, maxLevel 31).

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1001 | "The parameter \"id\" has a wrong id type! Provide only following id types: [\"sketch\"]" | Non-sketch destination |
| 1001 | "The parameter \"toCopyId\" has a wrong id type! Provide only following id types: [\"sketch\"]" | Non-sketch source |
| 1006 | "An element of parameter \"toCopyId\" has an invalid id!" | Nonexistent source |
| 1006 | "An element of parameter \"id\" has an invalid id!" | Nonexistent destination |

## Working Example

```js
const partId = (await api.v1.part.create({})).result
const srcSk = (await api.v1.sketch.create({ id: partId })).result
await api.v1.sketch.rectangle({ id: srcSk, startPos: [0, 0, 0], endPos: [40, 30, 0] })
await api.v1.sketch.circle({ id: srcSk, centerPos: [60, 15, 0], radius: 10 })
const dstSk = (await api.v1.sketch.create({ id: partId })).result

await api.v1.sketch.copyFrom({ id: dstSk, toCopyId: srcSk }) // dstSk: rectangle + circle, same positions
```

## Related

`sketch.copyGeometry` · `sketch.loadFrom` · `sketch.moveGeometry`
