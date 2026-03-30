# part.updateWorkPoint

Updates an existing work point feature — position, name, type, or references.

## Prerequisites

- A work point feature (from `part.workPoint`)
- **Must call `part.openFeature` before and `part.closeFeature` after** — without openFeature, update fails with "not active and open" (maxLevel=51)

## Key Parameters

- **`id`** (required) — work point feature ID (not part ID)
- **`name`** — new name. Fully replaces old name (old name no longer findable via getWorkGeometry).
- **`type`** — change the work point type. Must provide appropriate params for the new type.
- **`references`** — new geometry references. Required when changing to any non-USERDEFINED type.
- **`position`** — new `[x,y,z]` position. Only meaningful for USERDEFINED type.

## Return Value

```js
{ result: id|VOID, messages?: [...], maxLevel?: real }
```

On success returns the work point feature ID with maxLevel=31. On failure returns null with maxLevel=51.

## Behavior

- **Partial updates work** — only supply the params you want to change. Unset params keep existing values.
- **Type changes supported** — can switch between any types (e.g., USERDEFINED → BREPVERTEX → USERDEFINED). Provide correct params for the new type.
- **Position on referenced types is silently ignored** — passing position to a BREPVERTEX/CENTER/etc. type produces no error but has no effect.
- **Missing refs on type change** — changing to a referenced type without providing references returns the feature ID but with maxLevel=51 and "missing references" error. Feature may be in a broken state.

## Gotchas

- **openFeature is mandatory** — forgetting it is the #1 failure mode. Always wrap: `openFeature → updateWorkPoint → closeFeature`.
- **Name replacement is complete** — after renaming, the old name returns null from getWorkGeometry.
- **Position param silently ignored for referenced types** — no error, no warning, just no effect.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `"not active and open"` | Missing openFeature | Call `part.openFeature({ id: wpId })` first |
| `"not a feature or work geometry id"` | Passed part ID instead of feature ID | Use the ID returned by `part.workPoint` |
| `"type" is not valid` | Typo in type string | Use exact string: USERDEFINED, BREPVERTEX, EDGEMIDPOINT, CENTER, BARYCENTER, INTERSECTION, INNERCIRCLE, 2POINTS |
| `"missing references"` | Changed to referenced type without refs | Always pass `references` when changing to non-USERDEFINED type |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result

// Create a work point
const wpId = (await api.v1.part.workPoint({
  id: partId,
  name: 'WP1',
  position: [10, 20, 30]
})).result

// Update position (must use openFeature/closeFeature)
await api.v1.part.openFeature({ id: wpId })
await api.v1.part.updateWorkPoint({
  id: wpId,
  position: [60, 50, 40]
})
await api.v1.part.closeFeature({ id: wpId })

// Update name only
await api.v1.part.openFeature({ id: wpId })
await api.v1.part.updateWorkPoint({
  id: wpId,
  name: 'WP_renamed'
})
await api.v1.part.closeFeature({ id: wpId })

// Change type to BREPVERTEX (after creating geometry)
await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })
const gids = await api.v1.part.getGeometryIds({
  id: partId,
  points: [{ pos: [0, 0, 0] }]
})
await api.v1.part.openFeature({ id: wpId })
await api.v1.part.updateWorkPoint({
  id: wpId,
  type: 'BREPVERTEX',
  references: [gids.result.points[0]]
})
await api.v1.part.closeFeature({ id: wpId })
```

## Related

- `part.workPoint` — create work points
- `part.openFeature` / `part.closeFeature` — required wrapper for updates
- `part.getWorkGeometry` — find work point by name after rename
