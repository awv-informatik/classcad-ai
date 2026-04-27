# assembly.deleteInstance

Deletes instances from root assembly, assembly instances, or assembly templates.

## Prerequisites

- One or more valid instance IDs (from `assembly.instance` or `assembly.getInstance`)

## Key Parameters

- `ids` (required) — array of instance IDs to delete. Accepts:
  - Numeric IDs (from `instance()` return value or `getInstance()`)
  - Ident strings (assigned via `ident` param on `instance()` or `setIdent()`)
  - Name strings (instance name — resolved like any `string | id` parameter)
  - **Can mix types in one call** — e.g., `[numericId, 'my_ident', 'InstanceName']`

## Return Value

- Always returns `null` (VOID)
- maxLevel 31 on success
- maxLevel 51 on any error

## All-or-Nothing Semantics

**Pre-validation failure = total rollback.** If ANY ID in the array fails validation (wrong type, nonexistent), the ENTIRE call is rejected — NO instances are deleted. This catches:
- Nonexistent IDs
- Wrong ID types (part template, assembly, etc.)

**Execution-time failure = partial success.** If IDs pass validation but fail during processing (e.g., duplicate IDs where the first deletion invalidates the second), earlier deletions stick. Avoid this by deduplicating the `ids` array before calling.

## Bidirectional Propagation

Deleting an instance that belongs to an assembly template propagates:
- **From expanded-tree instance:** deletion propagates to the template AND all sibling instances
- **From template directly:** deletion propagates to ALL instances of that template

Each scope has its own IDs (template child 115, expanded-tree child 120, sibling's child 124) but the logical child is removed from all of them.

Deleting a top-level instance (direct child of root assembly) does NOT affect the template — the template retains all its children.

## Gotchas

- **Snapshots don't reflect instance deletion.** Template geometry persists in the rendering regardless of whether instances exist. Use `getInstance` to verify deletion, not snapshots.
- **Empty `ids: []` is a harmless no-op** — returns null with maxLevel 31
- **Duplicate IDs cause partial failure** — first occurrence is deleted, second triggers error (maxLevel 51). The first deletion still sticks.
- **Assembly remains fully usable after deletion.** New instances can be added after deleting existing ones.

## Common Errors

| Error | Cause |
|---|---|
| "wrong id type! Provide only following id types: [\"instance\"]" (code 1001) | Passed part template, assembly, or other non-instance ID |
| "ToId()/TOID() didn't get an existing or valid id." + "An element of parameter \"ids\" has an invalid id!" (code 1006) | Nonexistent ID or already-deleted instance |
| "[Evaluation error in AssemblyBuilder.RemoveInstance:[CCVM::callsf: objId not found]]" | Duplicate ID — first was deleted, second can't find it |
| "The parameter \"ids\" must be provided" (code 1004) | Missing `ids` parameter entirely |
| "Set the parameter \"ids\" = VOID is not allowed" (code 1001) | Passed null/undefined as `ids` |

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'Asm' })).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId, name: 'A', ident: 'block_a',
})).result
const inst2 = (await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId, name: 'B',
  transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
})).result

// Delete by numeric ID
await api.v1.assembly.deleteInstance({ ids: [inst1] })

// Delete by ident string
await api.v1.assembly.deleteInstance({ ids: ['block_a'] })

// Delete multiple (mixed types OK)
await api.v1.assembly.deleteInstance({ ids: [inst1, 'some_ident'] })

// Verify deletion
const remaining = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
```

## Related

- `assembly.instance` — create instances
- `assembly.getInstance` — look up instance IDs (use to verify deletion)
- `assembly.setCurrentProduct` — switch context after structural changes
