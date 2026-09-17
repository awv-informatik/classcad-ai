# solid.deleteSolid

Deletes specific solids by ID, or all solids of an entity injection feature (EIF). Works on any solid type (primitive, extrusion, revolve, boolean result, copy).

## Key Parameters

- **`id`** — EIF ID (required).
- **`ids`** (optional) — array of solid IDs to delete. Omit entirely to delete ALL solids in the `id` EIF.

## Two Modes

| Mode | Parameter | Behavior | Scope |
|---|---|---|---|
| **Specific** | `ids: [id1, id2, ...]` | Deletes listed solids only | Any solid in the part — `id` is a context reference, not a filter (`{ id: eif2, ids: [solid_in_eif1] }` succeeds) |
| **Delete all** | omit `ids` | Deletes all solids | Only the specified EIF; other EIFs untouched |

**`ids: []` ≠ omitting `ids`.** Empty array is a silent no-op ("delete nothing"); omitting `ids` deletes everything in the EIF.

## Return Value

`null` (VOID) on both success and failure — check `maxLevel`: `<= 31` success, `>= 51` error (one or more IDs invalid).

## Atomicity

`ids` is validated **atomically**: if ANY ID is invalid (nonexistent, wrong type, already deleted), the whole call fails and NOTHING is deleted — no partial success. If unsure about IDs, delete one at a time so one bad ID doesn't block valid deletions.

## Gotchas

- **Deleted IDs are permanently invalid** — copy, translate, boolean, etc. all fail with code 1006. Double-delete gives the same 1006 error as a nonexistent ID.
- **Delete from empty EIF:** silent no-op, no warnings (`maxLevel: 31`).
- **Deleting the original does not affect copies** — copies are fully independent.

## Common Errors

| Error code | Message | Cause |
|---|---|---|
| 1006 | `An element of parameter "ids" has an invalid id!` | Nonexistent, already-deleted, or out-of-range ID |
| 1001 | `The parameter "ids" has a wrong id type! Provide only following id types: ["solid"]` | EIF, part, or other non-solid ID passed |

Non-existent ID cases also include a warning (level 41): `"ToId()/TOID() didn't get an existing or valid id."`

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'DeleteDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const box1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
const box2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 50, translation: [80, 0, 0] })).result

const r1 = await api.v1.solid.deleteSolid({ id: eifId, ids: [box1] })  // result null, maxLevel 31
const r2 = await api.v1.solid.deleteSolid({ id: eifId })               // delete all — box2 gone
```

## Related

`solid.copy` · `solid.box` / `solid.sphere` · `solid.union` / `solid.subtraction`
