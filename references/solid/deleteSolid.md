# solid.deleteSolid

Deletes specific solids by ID or all solids within an entity injection feature.

## Prerequisites

- A part (`part.create`)
- An entity injection feature (`part.entityInjection`)
- One or more solids to delete (any type: box, sphere, cylinder, cone, extrusion, revolve, boolean result, copy)

## Key Parameters

- **`id`** — entity injection feature ID. Required, but for specific-ID deletion (`ids` array), it does NOT restrict which solids can be deleted — solids from ANY EIF in the same part can be targeted. For delete-all mode (no `ids`), it DOES scope the deletion to only this EIF.
- **`ids`** (optional) — array of solid IDs to delete. Omit entirely to delete ALL solids in the specified EIF.

## Two Modes

| Mode | Parameter | Behavior | Scope |
|---|---|---|---|
| **Specific** | `ids: [id1, id2, ...]` | Deletes listed solids only | Any solid in the part (cross-EIF) |
| **Delete all** | omit `ids` | Deletes all solids | Only the specified EIF |

**Critical distinction:** `ids: []` (empty array) is a **no-op** — NOT equivalent to omitting `ids`. Empty array = "delete nothing". Omit `ids` entirely = "delete everything in this EIF".

## Return Value

Returns `null` (VOID) on both success and failure. Check `maxLevel` to determine outcome:
- `maxLevel <= 31` → success (info level)
- `maxLevel >= 51` → error (one or more IDs invalid)

## Atomicity

The `ids` array is validated **atomically**. If ANY ID in the array is invalid (nonexistent, wrong type, already deleted), the ENTIRE call fails and NO deletions occur. Valid IDs are not processed individually — it's all-or-nothing.

## Gotchas

- **Cross-EIF deletion works for specific IDs.** The `id` param doesn't filter — `deleteSolid({ id: eif2, ids: [solid_in_eif1] })` succeeds. The `id` is a context reference, not a scope limiter.
- **Delete-all IS scoped.** Omitting `ids` only removes solids within the specified EIF. Other EIFs are untouched.
- **`ids: []` ≠ no `ids`.** Empty array is a silent no-op. Omitting `ids` triggers delete-all.
- **Deleted IDs are permanently invalid.** After deletion, the ID cannot be used in any subsequent API call — copy, translate, boolean, etc. all fail with code 1006.
- **Double-delete = same error as nonexistent.** Deleting an already-deleted solid returns the same code 1006 error as a nonexistent ID.
- **No partial success.** Mixed valid+invalid IDs = zero deletions + error.

## Common Errors

| Error code | Message | Cause |
|---|---|---|
| 1006 | `An element of parameter "ids" has an invalid id!` | Nonexistent, already-deleted, or out-of-range ID |
| 1001 | `The parameter "ids" has a wrong id type! Provide only following id types: ["solid"]` | Passed an EIF, part, or other non-solid object as a solid ID |

Both error types also include a warning (level 41): `"ToId()/TOID() didn't get an existing or valid id."` for non-existent ID cases.

## Safe Patterns

- **Delete from empty EIF:** No error, no warnings. Silent no-op (`maxLevel: 31`).
- **Delete after copy:** Deleting the original does not affect copies. Copies are fully independent.
- **Verify before delete:** Since the call is atomic, if you're unsure about IDs, delete them one at a time to avoid losing valid deletions to one bad ID.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'DeleteDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Create solids
const box1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
const box2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 50, translation: [80, 0, 0] })).result

// Delete specific solid
const r1 = await api.v1.solid.deleteSolid({ id: eifId, ids: [box1] })
// r1.result = null, r1.maxLevel = 31

// Delete all remaining solids
const r2 = await api.v1.solid.deleteSolid({ id: eifId })
// r2.result = null, r2.maxLevel = 31 — box2 gone
```

## Related

- `solid.copy` — duplicate a solid (copies survive deletion of their source)
- `solid.box` / `solid.sphere` / etc. — creation APIs whose results can be deleted
- `solid.union` / `solid.subtraction` — boolean operations that consume solids (different from deletion)
