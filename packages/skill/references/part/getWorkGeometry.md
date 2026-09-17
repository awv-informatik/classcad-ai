# part.getWorkGeometry

Looks up a work geometry feature (plane, axis, csys, point) by name and returns its ID.

## Key Parameters

- **`id`** (required) — part or instance ID
- **`name`** (required) — exact, full, case-sensitive name (`"Top"` works; `"top"`/`"TOP"` don't; no wildcard/partial match)

## Return Value

```js
{ result: id|VOID, messages?: [...], maxLevel?: real }
```

Feature ID (maxLevel=31), null on failure (maxLevel=51).

## Built-in Names

| Type | Names |
|------|-------|
| Work planes | `Top`, `Front`, `Right` |
| Work axes | `XAxis`, `YAxis`, `ZAxis` |
| Work points | `Origin` (a work point at [0,0,0] — not a work csys) |
| Work CSys | *(none — create one with `part.workCSys`)* |

**Exact names** — not `WorkPlane_Top`, not `XY`, not `X`.

## Gotchas

- **Duplicate names return the first-created** — even across types.
- **Empty string** fails with "Couldn't find work geometry with name: `""`".

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Couldn't find work geometry with name: "..."` | Name doesn't exist or wrong case | Check exact name, including capitalization |
| `"name" must be provided` | Missing name param | Pass `name: '...'` |
| `invalid id` | Wrong ID type | Pass a part or instance ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result

// Built-ins
const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
const xAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'XAxis' })).result
const originId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Origin' })).result

// User-created
const wpId = (await api.v1.part.workPlane({ id: partId, name: 'MyPlane', position: [0, 0, 50], normal: [0, 0, 1] })).result
const found = (await api.v1.part.getWorkGeometry({ id: partId, name: 'MyPlane' })).result // === wpId
```

## Related

`part.workPlane` / `part.workAxis` / `part.workCSys` / `part.workPoint` · `part.updateWorkPlane`
