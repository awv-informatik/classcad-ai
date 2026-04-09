# sketch.getSketchRegion

Looks up a sketch region by name within a sketch. Returns the region's ID or `null` if not found.

## Prerequisites

- A sketch (`sketch.create` or `part.sketch`)
- A sketch region created with `sketch.sketchRegion` (with a known name)

## Key Parameters

- `id` — sketch ID (required). Must be a `sketch` type ID — part IDs, curve IDs, etc. are rejected with code 1001.
- `name` — exact name of the region to find (required). **Case-sensitive** — `"MyRegion"` and `"myregion"` are different names.

## Return Value

- **Found:** `result` = region ID (number), `maxLevel` = 31, `messages` = `[]`
- **Not found:** `result` = `null`, `maxLevel` = 51, error code 1015

## Gotchas

- **Name matching is case-sensitive.** Only exact matches work. `"MyProfile"` will NOT match `"myprofile"` or `"MYPROFILE"`.
- **Name collision trap.** `sketchRegion` silently auto-suffixes names that collide with existing objects in the drawing. Every part has default work planes named "Top", "Front", "Right" — so if you create a region with `name: 'Right'`, it's actually stored as `"Right0"`. You must look up by the actual stored name, not the name you passed to `sketchRegion`. Non-colliding names are stored as-is.
- **Default auto-generated names** follow the pattern: first region = `"SketchRegion"`, second = `"SketchRegion0"`, third = `"SketchRegion1"`, etc. These are the names to use in lookups when no custom name was provided.

## Common Errors

| Error | Code | Meaning |
|---|---|---|
| `Couldn't find sketch region with name: "X" which belongs to the provided sketch.` | 1015 | No region with that exact name exists in this sketch |
| `The parameter "id" has a wrong id type! Provide only following id types: ["sketch"]` | 1001 | Passed a non-sketch ID (part ID, curve ID, etc.) |
| `An element of parameter "id" has an invalid id!` | 1006 | Passed a nonexistent/fake ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

const rectIds = (await api.v1.sketch.rectangle({
  id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0],
})).result

// Create a named region
const regionId = (await api.v1.sketch.sketchRegion({
  id: skId, geomIds: rectIds, name: 'Profile',
})).result

// Look it up
const r = await api.v1.sketch.getSketchRegion({ id: skId, name: 'Profile' })
// r.result === regionId (true)

// Not found case
const r2 = await api.v1.sketch.getSketchRegion({ id: skId, name: 'Nonexistent' })
// r2.result === null, r2.maxLevel === 51
```

## Related

- `sketch.sketchRegion` — creates the region this API looks up
- `sketch.updateSketchRegion` — updates geometry of an existing region
- [`part.getSketchRegion`](../part/getSketchRegion.md) — same lookup but takes a part ID instead of sketch ID (searches across all sketches in the part). Returns the first match if multiple sketches have regions with the same name.
