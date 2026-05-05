# assembly.deleteInstance

Removes instances from the assembly tree. Template and other instances are unaffected.

## Prerequisites

- Existing instance IDs to delete

## Key Parameters

- `ids` — **required**. Array of instance IDs to delete. Empty array `[]` is accepted as a no-op.

## Return Value

Always `null` (VOID), regardless of success or failure. Check `maxLevel` to detect errors.

## Gotchas

- **Re-deleting an already-deleted ID** returns maxLevel=51, error 1006 "invalid id."
- **Empty `ids: []`** is accepted silently (maxLevel=31, no-op).
- **Invalid IDs (e.g., 999999)** return error 1006.
- **Template is unaffected** — deleting all instances of a template does not delete the template itself.
- **Stale `currentProduct`** — if the deleted instance was `currentProduct` in the structure, the pointer may become stale (see `assembly/deleteTemplate.md` for similar behavior).

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `ToId() didn't get an existing or valid id` | 0 (warn) | ID doesn't exist (deleted or never created) |
| `"ids" has an invalid id` | 1006 | Invalid or already-deleted instance ID |

## Working Example

```js
// Delete single
await api.v1.assembly.deleteInstance({ ids: [inst1] })

// Delete multiple
await api.v1.assembly.deleteInstance({ ids: [inst2, inst3] })

// Verify deletion
const remaining = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
// → only undeleted instances remain
```

## Related

- `assembly.instance` — create instances
- `assembly.getInstance` — query instances
- `assembly.deleteTemplate` — deletes template + cascades to all its instances
