# part.getWorkGeometry

Looks up a work geometry feature by name and returns its ID. Works for all 4 types: work planes, axes, coordinate systems, and points.

## Prerequisites

- A part (`part.create`) or instance ID

## Key Parameters

- **`id`** (required) — part or instance ID
- **`name`** (required) — exact name string of the work geometry

## Return Value

```js
{ result: id|VOID, messages?: [...], maxLevel?: real }
```

Returns the feature ID on success (maxLevel=31), null on failure (maxLevel=51).

## Built-in Names

Every new part has these built-in work geometries:

| Type | Names |
|------|-------|
| Work planes | `Top`, `Front`, `Right` |
| Work axes | `XAxis`, `YAxis`, `ZAxis` |
| Work CSys | `Origin` |
| Work points | *(none — no built-in work points)* |

**These are the exact names.** Not `WorkPlane_Top`, not `XY`, not `X`. Case matters.

## Gotchas

- **Case-sensitive** — `"Top"` works, `"top"` and `"TOP"` do not. Must match exactly.
- **Duplicate names return the first-created** — if two work geometries share a name (even across types), the one created first is returned.
- **No wildcard or partial match** — must be the full, exact name string.
- **Empty string is a valid query** — it just fails with "Couldn't find work geometry with name: `""`".

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Couldn't find work geometry with name: "..."` | Name doesn't exist or wrong case | Check exact name, including capitalization |
| `"name" must be provided` | Missing name param | Pass `name: '...'` |
| `invalid id` | Wrong ID type | Pass a part or instance ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result

// Look up built-in work planes
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const frontId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result

// Look up built-in axes and CSys
const xAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'XAxis' })).result
const originId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Origin' })).result

// Look up user-created work geometry
const wpId = (await api.v1.part.workPlane({
  id: partId, name: 'MyPlane',
  origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0]
})).result
const found = (await api.v1.part.getWorkGeometry({ id: partId, name: 'MyPlane' })).result
// found === wpId
```

## Related

- `part.workPlane` / `part.workAxis` / `part.workCSys` / `part.workPoint` — create the geometry this looks up
- `part.updateWorkPlane` etc. — use with `openFeature` to rename, then look up by new name
