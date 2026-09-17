# sketch.getSketchRegion

Looks up a sketch region (from `sketch.sketchRegion`) by name within a sketch.

## Key Parameters

- `id` (required) — sketch ID. Non-sketch IDs → code 1001.
- `name` (required) — exact, **case-sensitive** region name (`"MyRegion"` ≠ `"myregion"`).

## Return Value

- **Found:** region ID, maxLevel 31, `messages: []`
- **Not found:** `null`, maxLevel 51, code 1015

## Gotchas

- **Name collision trap.** `sketchRegion` silently auto-suffixes names that collide with existing drawing objects. Every part has default work planes "Top", "Front", "Right" — `name: 'Right'` is stored as `"Right0"`. Look up the stored name; non-colliding names are stored as-is.
- **Default names:** `"SketchRegion"`, then `"SketchRegion0"`, `"SketchRegion1"`, …

## Common Errors

| Error | Code | Meaning |
|---|---|---|
| `Couldn't find sketch region with name: "X" which belongs to the provided sketch.` | 1015 | No region with that exact name in this sketch |
| `The parameter "id" has a wrong id type! Provide only following id types: ["sketch"]` | 1001 | Non-sketch ID (part, curve, …) |
| `An element of parameter "id" has an invalid id!` | 1006 | Nonexistent/fake ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result
const planeId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const skId = (await api.v1.sketch.create({ id: partId, planeId })).result
const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds, name: 'Profile' })).result

const r = await api.v1.sketch.getSketchRegion({ id: skId, name: 'Profile' }) // r.result === regionId

// Not found: result null, maxLevel 51 (throws in strict script api)
try { await api.v1.sketch.getSketchRegion({ id: skId, name: 'Nonexistent' }) } catch (e) {}
```

## Related

`sketch.sketchRegion` · `sketch.updateSketchRegion` · [`part.getSketchRegion`](../part/getSketchRegion.md)
