# part.getSketch

Looks up a sketch by name inside a part and returns its ID. This is the primary way to retrieve a sketch when you know its name but not its ID.

## Prerequisites

- A part (`part.create`)
- A sketch inside that part (created via `part.sketch` or `sketch.create`)

## Key Parameters

- **`id`** (required) — part ID. Must be a part — any other ID type gives error 1001.
- **`name`** (required) — exact sketch name to search for. **Case-sensitive** and **literal** — no trimming, no fuzzy matching. `"MySketch"` and `"mysketch"` are different names.

## Return Value

**On success:**
```js
{ result: sketchId, messages: [], maxLevel: 31 }
```

**On not found:**
```js
{ result: null, messages: [{ code: 1015, level: 51, message: 'Sketch with name "X" does not exist' }], maxLevel: 51 }
```

Returns `null` (not VOID) when no match is found.

## Gotchas

- **Case-sensitive.** `"Sketch"` does not match `"sketch"` or `"SKETCH"`.
- **First-match only.** If multiple sketches share the same name (duplicate names are allowed), `getSketch` always returns the **first-created** one. Later duplicates are unreachable by name.
- **Literal matching.** Spaces, slashes, parentheses, dots — all compared exactly. `"  Sketch  "` (with spaces) is a valid and distinct name.
- **`getSketchRegion` uses region names, not sketch names.** Don't call `getSketchRegion({ name: 'MySketch' })` expecting it to find the region inside sketch "MySketch" — the region has its own name.
- **Default auto-naming:** Unnamed sketches get auto-generated names: `"Sketch"`, `"Sketch0"`, `"Sketch1"`, etc. Note the first has no number suffix; numbering starts at 0 from the second.

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| "Sketch with name X does not exist" | 1015 | No sketch with that exact name |
| "parameter 'id' must be provided" | 1004 | `id` omitted |
| "parameter 'name' must be provided" | 1004 | `name` omitted |
| "wrong id type — provide only: ['part']" | 1001 | `id` is not a part (sketch, EIF, workplane, etc.) |
| "invalid id" | 1006 | Non-existent or zero ID |

Validation order: `id` is checked before `name` — if both are missing, you get the `id` error.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.part.sketch({ id: partId, name: 'FrontProfile' })).result

// Later, look it up by name
const found = (await api.v1.part.getSketch({ id: partId, name: 'FrontProfile' })).result
// found === skId
```

## Related

- `part.sketch` / `sketch.create` — create sketches (what you look up with this API)
- `part.getSketchRegion` — similar lookup but for sketch regions (uses region names, not sketch names)
- `part.getWorkGeometry` — analogous name-based lookup for work geometry
- `sketch.deleteSketch` — delete sketches by ID
