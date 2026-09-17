# part.getSketchRegion

Finds a sketch region by name across all sketches of a part (or instance). If you know the sketch, prefer `sketch.getSketchRegion` — more precise, no duplicate-name ambiguity.

## Key Parameters

- `id` (required) — accepted types `["part", "instance"]`; sketch, curve, etc. IDs → 1001
- `name` (required) — exact, **case-sensitive** region name

## Return Value

- **Found:** `result` = region ID, `maxLevel` 31, `messages` `[]`
- **Not found:** `result` = `null`, `maxLevel` 51, error code 0 (`sketch.getSketchRegion` uses 1015 instead)

## Gotchas

- **Duplicate names across sketches:** returns the **first one found**; the other is unreachable here — use `sketch.getSketchRegion` with the sketch ID.
- **Name collision trap:** `sketchRegion` silently auto-suffixes names colliding with existing objects (e.g. default planes "Top", "Front", "Right") — `name: 'Right'` is stored as `"Right0"`. Look up the actual stored name.

## Common Errors

| Error | Code | Meaning |
|---|---|---|
| `Couldn't find sketch region with name: "X"` | 0 | No region with that exact name in any sketch of this part |
| `The parameter "id" has a wrong id type! Provide only following id types: ["part","instance"]` | 1001 | Sketch ID, curve ID, or other non-part/instance ID |
| `An element of parameter "id" has an invalid id!` | 1006 | Nonexistent/fake ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result
const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds, name: 'Profile' })).result

const r = await api.v1.part.getSketchRegion({ id: partId, name: 'Profile' }) // r.result === regionId
```

## Related

`sketch.getSketchRegion` · `sketch.sketchRegion` · `sketch.updateSketchRegion`
