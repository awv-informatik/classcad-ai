# part.getSketch

Looks up a sketch by name inside a part and returns its ID.

## Key Parameters

- **`id`** (required) — part ID; any other ID type → error 1001
- **`name`** (required) — exact name. **Case-sensitive and literal**: no trimming or fuzzy matching; spaces, slashes, parentheses, dots compared exactly (`"  Sketch  "` is a distinct valid name; `"Sketch"` ≠ `"sketch"`)

## Return Value

```js
// found
{ result: sketchId, messages: [], maxLevel: 31 }
// not found — null, not VOID
{ result: null, messages: [{ code: 1015, level: 51, message: 'Sketch with name "X" does not exist' }], maxLevel: 51 }
```

## Gotchas

- **First match only.** Duplicate names are allowed; `getSketch` returns the **first-created** one — later duplicates are unreachable by name.
- **`getSketchRegion` uses region names, not sketch names.** `getSketchRegion({ name: 'MySketch' })` won't find the region inside sketch "MySketch" — the region has its own name.
- **Auto-naming:** unnamed sketches get `"Sketch"`, `"Sketch0"`, `"Sketch1"`, … (first has no suffix; numbering starts at 0 from the second).

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| "Sketch with name X does not exist" | 1015 | No sketch with that exact name |
| "parameter 'id' must be provided" | 1004 | `id` omitted (checked before `name` — if both missing, you get this) |
| "parameter 'name' must be provided" | 1004 | `name` omitted |
| "wrong id type — provide only: ['part']" | 1001 | `id` is not a part (sketch, EIF, workplane, etc.) |
| "invalid id" | 1006 | Non-existent or zero ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const skId = (await api.v1.part.sketch({ id: partId, name: 'FrontProfile' })).result
const found = (await api.v1.part.getSketch({ id: partId, name: 'FrontProfile' })).result // === skId
```

## Related

`part.sketch` / `sketch.create` · `part.getSketchRegion` · `part.getWorkGeometry` · `sketch.deleteSketch`
