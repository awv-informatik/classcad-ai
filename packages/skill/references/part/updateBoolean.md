# part.updateBoolean

Updates a boolean feature's type, name, target, or tools. Must be wrapped in `openFeature` / `closeFeature`; several updates can run inside one open/close session.

## Key Parameters

- `id` — boolean feature ID from `part.boolean`
- `type` — `"UNION"`, `"SUBTRACTION"`, `"INTERSECTION"` (optional; recomputes geometry on `closeFeature`)
- `name` — optional; name-only changes don't affect geometry
- `target` — `{id, indices?}` (optional)
- `tools` — feature IDs or `[{id, indices?}]` (optional; tool count can change, e.g. 1 → 2)

All optional params can be combined in one call.

## Return Value

The boolean feature ID (same as input, never changes). maxLevel 31 on success.

## Target & Tool Swapping

Changing `target`/`tools` **releases** the old features (unconsumed, visible, available again) and **consumes** the new ones — freely in both directions, as long as the replacements exist **before** the boolean in the design tree.

## Gotchas

- **Without `openFeature`:** result null, maxLevel 51, error 1200 `"The provided feature is not allowed to update. It's not active and open."` followed by 1004 `"\"id\" must be provided for update."`
- **Feature ordering constraint.** `openFeature` rolls the tree back to just before the boolean; features created AFTER it don't exist there and can't be targets/tools. Error 1014 `"Entity \"...\" is not available. It has already been consumed/used in another operation."` — misleading (the feature doesn't exist yet at that tree position). Create replacements BEFORE the boolean.

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| `"The provided feature is not allowed to update..."` | 1200 | Missing `openFeature` | Call `part.openFeature({ id })` first |
| `"\"id\" must be provided for update."` | 1004 | Follows 1200 — same cause | Same fix |
| `"Entity \"...\" is not available..."` | 1014 | New target/tool created after the boolean | Create it before the boolean |
| `"ToId()/TOID() didn't get an existing or valid id."` + code 1006 | 0, 1006 | Invalid/non-existent target ID | Verify feature ID exists |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'UpdateDemo' })).result
// All candidate features BEFORE the booleans
const plate = (await api.v1.part.box({ id: partId, name: 'Plate', length: 120, width: 80, height: 10 })).result
const riserCS = (await api.v1.part.workCSys({ id: partId, name: 'RiserCS', offset: [0, 10, 10] })).result
const riser = (await api.v1.part.box({ id: partId, name: 'Riser', length: 15, width: 60, height: 60, references: [riserCS] })).result
const bodyId = (await api.v1.part.boolean({ id: partId, type: 'UNION', target: plate, tools: [riser] })).result
const holeCS = (await api.v1.part.workCSys({ id: partId, name: 'HoleCS', offset: [80, 40, -5] })).result
const hole = (await api.v1.part.cylinder({ id: partId, name: 'Hole', diameter: 12, height: 20, references: [holeCS] })).result
const slotCS = (await api.v1.part.workCSys({ id: partId, name: 'SlotCS', offset: [65, 36, -5] })).result
const slot = (await api.v1.part.box({ id: partId, name: 'Slot', length: 30, width: 8, height: 20, references: [slotCS] })).result

const subId = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: bodyId, tools: [hole] })).result

// Swap hole for slot — hole becomes unconsumed
await api.v1.part.openFeature({ id: subId })
await api.v1.part.updateBoolean({ id: subId, tools: [slot] })
await api.v1.part.closeFeature({ id: subId })

// Change type + name
await api.v1.part.openFeature({ id: subId })
await api.v1.part.updateBoolean({ id: subId, type: 'UNION', name: 'NewName' })
await api.v1.part.closeFeature({ id: subId })
```

## Related

`part.boolean` · `part.openFeature` / `part.closeFeature`
