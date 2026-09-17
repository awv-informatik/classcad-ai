# part.updateWorkPoint

Updates an existing work point — position, name, type, or references. **Must call `part.openFeature` before and `part.closeFeature` after** — without openFeature it fails with "not active and open" (maxLevel=51); the #1 failure mode.

## Key Parameters

- **`id`** (required) — work point feature ID (not part ID)
- **`name`** — fully replaces the old name (old name returns null from `getWorkGeometry`)
- **`type`** — any type switch works (e.g. USERDEFINED → BREPVERTEX → USERDEFINED); supply the params the new type needs
- **`references`** — required when changing to any non-USERDEFINED type
- **`position`** — `[x,y,z]`, USERDEFINED only

Partial updates: omitted params keep their values.

## Return Value

```js
{ result: id|VOID, messages?: [...], maxLevel?: real }
```

Work point ID with maxLevel=31; null with maxLevel=51 on failure.

## Gotchas

- **`position` on a referenced type (BREPVERTEX/CENTER/…) is silently ignored** — no error, no warning, no effect.
- **Type change without refs** returns the feature ID but maxLevel=51 with "missing references"; the feature may be broken.

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
// Reference geometry must exist before the point (openFeature rolls the tree back to it)
await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })
const vertexId = (await api.v1.part.getGeometryIds({ id: partId, points: [{ pos: [0, 0, 0] }] })).result.points[0]
const wpId = (await api.v1.part.workPoint({ id: partId, name: 'WP1', position: [10, 20, 30] })).result

// Position + name
await api.v1.part.openFeature({ id: wpId })
await api.v1.part.updateWorkPoint({ id: wpId, position: [60, 50, 40], name: 'WP_renamed' })
await api.v1.part.closeFeature({ id: wpId })

// Change type to BREPVERTEX
await api.v1.part.openFeature({ id: wpId })
await api.v1.part.updateWorkPoint({ id: wpId, type: 'BREPVERTEX', references: [vertexId] })
await api.v1.part.closeFeature({ id: wpId })
```

## Related

`part.workPoint` · `part.openFeature` / `part.closeFeature` · `part.getWorkGeometry`
