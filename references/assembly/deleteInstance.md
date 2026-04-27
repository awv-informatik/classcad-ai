# assembly.deleteInstance

Deletes instances from root assembly, other instances, or assembly templates.

## Prerequisites

- Existing instance IDs to delete

## Key Parameters

- `ids` (required) — array of instance IDs (or ident strings) to delete. Only accepts instance-type IDs.

## Return Value

- Always returns null (VOID) on success with maxLevel 31
- Empty `ids: []` is a harmless no-op (no error)

## Gotchas

- Re-deleting an already-deleted instance → error 51: "ToId()/TOID() didn't get an existing or valid id."
- Passing non-instance IDs (part template, assembly) → error 51: "wrong id type! Provide only following id types: [\"instance\"]"
- **Bidirectional propagation:** deleting from an expanded-tree instance propagates to template + all sibling instances
- Ident strings work in the `ids` array (resolved like any other `string | id` parameter)

## Working Example

```js
// Delete single
await api.v1.assembly.deleteInstance({ ids: [instId] })

// Delete multiple
await api.v1.assembly.deleteInstance({ ids: [inst1, inst2, inst3] })

// Delete by ident
await api.v1.assembly.deleteInstance({ ids: ['my_ident_string'] })
```

## Related

- `assembly.instance` — create instances
- `assembly.getInstance` — look up instance IDs
