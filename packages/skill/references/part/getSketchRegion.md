# part.getSketchRegion

Finds a sketch region by name within a part, searching across all sketches. Returns the region's ID or `null` if not found.

Use this when you know the part but not which sketch contains the region. If you know the sketch, prefer `sketch.getSketchRegion` — it's more precise and avoids the ambiguity of duplicate names.

## Prerequisites

- A part (`part.create`) or instance
- A sketch region created with `sketch.sketchRegion` (with a known name)

## Key Parameters

- `id` — part or instance ID (required). Accepted types: `["part", "instance"]`. Sketch IDs, curve IDs, etc. are rejected with code 1001.
- `name` — exact name of the region to find (required). **Case-sensitive** — `"MyRegion"` and `"myregion"` are different names.

## Return Value

- **Found:** `result` = region ID (number), `maxLevel` = 31, `messages` = `[]`
- **Not found:** `result` = `null`, `maxLevel` = 51, error code 0

## Gotchas

- **Searches all sketches in the part.** If two sketches have regions with the same name, this API returns the **first one found**. The second is unreachable. Use `sketch.getSketchRegion` with the specific sketch ID to disambiguate.
- **Name collision trap.** `sketchRegion` silently auto-suffixes names that collide with existing objects (e.g., default work planes "Top", "Front", "Right"). A region created with `name: 'Right'` is stored as `"Right0"`. You must look up by the actual stored name.
- **Case-sensitive matching.** Only exact name matches work.
- **Error code differs from sketch version.** `part.getSketchRegion` returns error code 0 on not-found; `sketch.getSketchRegion` returns code 1015.

## Common Errors

| Error | Code | Meaning |
|---|---|---|
| `Couldn't find sketch region with name: "X"` | 0 | No region with that exact name exists in any sketch of this part |
| `The parameter "id" has a wrong id type! Provide only following id types: ["part","instance"]` | 1001 | Passed a sketch ID, curve ID, or other non-part/instance ID |
| `An element of parameter "id" has an invalid id!` | 1006 | Passed a nonexistent/fake ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

const rectIds = (await api.v1.sketch.rectangle({
  id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0],
})).result

const regionId = (await api.v1.sketch.sketchRegion({
  id: skId, geomIds: rectIds, name: 'Profile',
})).result

// Look up from part level (searches all sketches)
const r = await api.v1.part.getSketchRegion({ id: partId, name: 'Profile' })
// r.result === regionId (true)
```

## Related

- `sketch.getSketchRegion` — same lookup but scoped to a single sketch (takes sketch ID)
- `sketch.sketchRegion` — creates the region this API looks up
- `sketch.updateSketchRegion` — updates geometry of an existing region
