# part.updateWorkCSys

Modifies an existing work coordinate system. Only provided parameters change. **Must be wrapped in `openFeature` / `closeFeature`** (the #1 mistake).

## Key Parameters

- **`id`** (required) — CSys feature ID (from `workCSys` or `getWorkGeometry`), NOT the part ID
- **`name`** — rename
- **`type`** — `"CUSTOM"` or `"XYAXISORIGIN"`
- **`references`** — new XYAXISORIGIN refs; can be updated alone without re-specifying type
- **`offset`** — `[x,y,z]`; numeric array or string vector with expressions `'[0, 0, @expr.H]'`
- **`rotation`** — `[rx,ry,rz]` radians; numeric array or string vector `'[0, 0, @expr.A]'`
- **`inverted`** — boolean, mirrors X-axis

## Return Value

```js
{ result: id|VOID, messages?: [...], maxLevel?: real }
```

Same CSys ID on success (maxLevel 31).

## Gotchas

- **Type change to XYAXISORIGIN without refs succeeds silently** (maxLevel=31, no error), unlike updateWorkAxis which errors "missing references". The CSys may be in an undefined reference state.
- **The built-in `Origin` is a work point, not a csys** — `updateWorkCSys` on it fails (e.g. offset update: "param must have the format: [value_any, isExpression_bl]").
- **Multiple updates in one open session work.** No-op update returns maxLevel 31.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "not active and open" | Missing `openFeature` | Wrap in `openFeature`/`closeFeature` |
| "id must be provided for update" | Missing `id` param | Pass the CSys feature ID |
| "not a feature or work geometry id" | Part ID instead of CSys ID | Use the ID from `workCSys` or `getWorkGeometry` |
| "param must have the format" | Updating built-in Origin offset | Don't modify built-in Origin geometry |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
// Refs must exist before the csys (openFeature rolls the tree back to it)
const originPt = (await api.v1.part.workPoint({ id: partId, name: 'WP1', position: [40, 30, 20] })).result
const axis1 = (await api.v1.part.getWorkGeometry({ id: partId, name: 'XAxis' })).result
const axis2 = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result
const csId = (await api.v1.part.workCSys({ id: partId, name: 'CS1', offset: [0, 0, 0] })).result

// Offset, rotation, inverted in one session
await api.v1.part.openFeature({ id: csId })
await api.v1.part.updateWorkCSys({ id: csId, offset: [50, 30, 20] })
await api.v1.part.updateWorkCSys({ id: csId, rotation: [0, 0, Math.PI / 4], inverted: true })
await api.v1.part.closeFeature({ id: csId })

// Change type to XYAXISORIGIN
await api.v1.part.openFeature({ id: csId })
await api.v1.part.updateWorkCSys({ id: csId, type: 'XYAXISORIGIN', references: [originPt, axis1, axis2] })
await api.v1.part.closeFeature({ id: csId })
```

## Related

`part.openFeature` / `part.closeFeature` · `part.workCSys` · `part.getWorkGeometry`
