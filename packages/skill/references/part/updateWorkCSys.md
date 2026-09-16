# part.updateWorkCSys

Modifies an existing work coordinate system feature. Only provided parameters change — omitted ones keep current values.

## Prerequisites

- A work CSys feature (from `part.workCSys`)
- The CSys feature ID (not the part ID)
- **Must be wrapped in `openFeature` / `closeFeature`** — this is not optional

## The Pattern

```js
await api.v1.part.openFeature({ id: csId })
await api.v1.part.updateWorkCSys({ id: csId, offset: [50, 30, 20] })
await api.v1.part.closeFeature({ id: csId })
```

## Key Parameters

- **`id`** (required) — the CSys feature ID (from `workCSys` result or `getWorkGeometry`). NOT the part ID.
- **`name`** — rename the feature.
- **`type`** — change type. `"CUSTOM"` or `"XYAXISORIGIN"`. Switching to XYAXISORIGIN without refs **silently succeeds** (unlike updateWorkAxis which errors).
- **`references`** — new reference IDs for XYAXISORIGIN. Can update alone without re-specifying type.
- **`offset`** — `[x,y,z]` translation vector. Numeric array, or a string vector with expressions: `'[0, 0, @expr.H]'`.
- **`rotation`** — `[rx,ry,rz]` Euler angles in radians. Numeric array, or a string vector with expressions: `'[0, 0, @expr.A]'`.
- **`inverted`** — boolean, mirrors X-axis.

## Return Value

```js
{ result: id|VOID, messages?: [...], maxLevel?: real }
```

Returns the same CSys ID on success (maxLevel 31).

## Gotchas

- **openFeature/closeFeature is mandatory.** #1 mistake.
- **`id` is the CSys ID, not the part ID.**
- **Type change to XYAXISORIGIN without refs succeeds silently** — maxLevel=31, no error. This differs from updateWorkAxis which errors "missing references". The CSys may be in an undefined reference state.
- **The built-in `Origin` is a work point, not a csys** — `updateWorkCSys` on it fails (e.g. offset update: "param must have the format: [value_any, isExpression_bl]").
- **Multiple updates in one open session work.**
- **No-op update is harmless** — returns maxLevel 31.

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
const csId = (await api.v1.part.workCSys({
  id: partId, name: 'CS1', offset: [0, 0, 0]
})).result

// Update offset
await api.v1.part.openFeature({ id: csId })
await api.v1.part.updateWorkCSys({ id: csId, offset: [50, 30, 20] })
await api.v1.part.closeFeature({ id: csId })

// Update rotation + inverted in one session
await api.v1.part.openFeature({ id: csId })
await api.v1.part.updateWorkCSys({ id: csId, rotation: [0, 0, Math.PI / 4] })
await api.v1.part.updateWorkCSys({ id: csId, inverted: true })
await api.v1.part.closeFeature({ id: csId })

// Change type to XYAXISORIGIN
await api.v1.part.openFeature({ id: csId })
await api.v1.part.updateWorkCSys({
  id: csId,
  type: 'XYAXISORIGIN',
  references: [originPt, axis1, axis2]
})
await api.v1.part.closeFeature({ id: csId })
```

## Related

`part.openFeature` / `part.closeFeature` · `part.workCSys` · `part.getWorkGeometry`
