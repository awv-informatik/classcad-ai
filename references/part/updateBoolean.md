# part.updateBoolean

Updates an existing boolean feature. Can change the operation type, name, target, and tools. Requires the `openFeature`/`closeFeature` gate.

## Prerequisites

- An existing boolean feature (from `part.boolean`)
- Feature must be opened with `part.openFeature` before calling
- New target/tools must exist **before** the boolean in the design tree (see Gotchas)

## Key Parameters

- `id` — the boolean feature ID (returned from `part.boolean`)
- `type` — `"UNION"`, `"SUBTRACTION"`, or `"INTERSECTION"` (optional — only set to change)
- `name` — new name for the feature (optional)
- `target` — object `{id, indices?}` to change the base feature (optional)
- `tools` — array of feature IDs or `[{id, indices?}]` objects to change tool features (optional)

All optional params can be combined in a single call (e.g., change type + name simultaneously).

## Return Value

Returns the boolean feature ID (same ID as input, never changes). maxLevel=31 on success.

## Target & Tool Swapping

When you change `target` or `tools`, the old features are **released** (become unconsumed and available again) and the new features are **consumed**. This is bidirectional — you can swap features in and out of a boolean freely, as long as the replacement features exist before the boolean in the design tree.

- Changing from 1 tool to 2 tools works — tool count is flexible
- Old tools become visible unconsumed features after the swap
- Target swap releases the old target and consumes the new one

## Usage Pattern

```js
// Change type
await api.v1.part.openFeature({ id: boolId })
await api.v1.part.updateBoolean({ id: boolId, type: 'SUBTRACTION' })
await api.v1.part.closeFeature({ id: boolId })

// Change target and tools
await api.v1.part.openFeature({ id: boolId })
await api.v1.part.updateBoolean({ id: boolId, target: { id: newBaseId }, tools: [newToolId] })
await api.v1.part.closeFeature({ id: boolId })

// Sequential updates — each needs its own open/close cycle
await api.v1.part.openFeature({ id: boolId })
await api.v1.part.updateBoolean({ id: boolId, type: 'INTERSECTION' })
await api.v1.part.closeFeature({ id: boolId })

await api.v1.part.openFeature({ id: boolId })
await api.v1.part.updateBoolean({ id: boolId, type: 'UNION', name: 'NewName' })
await api.v1.part.closeFeature({ id: boolId })
```

## Gotchas

- **`openFeature` is mandatory.** Without it: error code 1200 `"The provided feature is not allowed to update. It's not active and open."` followed by code 1004 `"\"id\" must be provided for update."`. Result is null, maxLevel=51.
- **Feature ordering constraint.** `openFeature` rolls back the design tree to just before the boolean. Features created AFTER the boolean do not exist in the rolled-back state and cannot be used as new targets/tools. Error: code 1014 `"Entity \"...\" is not available. It has already been consumed/used in another operation."` — the message is misleading (says "consumed" when the feature actually doesn't exist yet at that tree position). To swap in a new tool, create it BEFORE the boolean in the design tree.
- Changing `type` recomputes geometry on `closeFeature`.
- Name-only changes do not affect geometry.

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| `"The provided feature is not allowed to update..."` | 1200 | Missing `openFeature` call | Call `part.openFeature({ id })` first |
| `"\"id\" must be provided for update."` | 1004 | Follows code 1200 — same cause | Same fix |
| `"Entity \"...\" is not available..."` | 1014 | New target/tool created after the boolean in design tree | Create the replacement feature before the boolean |
| `"ToId()/TOID() didn't get an existing or valid id."` + code 1006 | 0, 1006 | Invalid/non-existent target ID | Verify feature ID exists |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'UpdateDemo' })).result

// Create features — all BEFORE the boolean
const plate = (await api.v1.part.box({ id: partId, name: 'Plate', length: 120, width: 80, height: 10 })).result
const riser = (await api.v1.part.box({ id: partId, name: 'Riser', length: 15, width: 60, height: 60, translation: [0, 10, 10] })).result
const bodyId = (await api.v1.part.boolean({ id: partId, type: 'UNION', target: plate, tools: [riser] })).result

const hole = (await api.v1.part.cylinder({ id: partId, name: 'Hole', diameter: 12, height: 20, translation: [80, 40, -5] })).result
const slot = (await api.v1.part.box({ id: partId, name: 'Slot', length: 30, width: 8, height: 20, translation: [65, 36, -5] })).result

// Subtract hole
const subId = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: bodyId, tools: [hole] })).result

// Later, swap hole for slot
await api.v1.part.openFeature({ id: subId })
await api.v1.part.updateBoolean({ id: subId, tools: [slot] })
await api.v1.part.closeFeature({ id: subId })
// Hole is now unconsumed; slot is the new tool
```

## Related

- `part.boolean` — creates the boolean feature this updates
- `part.openFeature` / `part.closeFeature` — required gate for all update APIs
