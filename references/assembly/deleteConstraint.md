# assembly.deleteConstraint

Deletes constraints and relations from assemblies. Accepts any mix of constraint types (fastened, fastenedOrigin, revolute, cylindrical, planar, parallel, slider, spherical) and relation types (gear, group) in a single call.

## Prerequisites

- An assembly with existing constraints or relations to delete

## Key Parameters

- `ids` — array of constraint/relation IDs to delete (required). Accepts IDs returned from any constraint creation call (`fastened`, `revolute`, `gear`, `group`, etc.).

## Return Value

- `result: null` (VOID) on success
- `maxLevel: 31` on success (no messages)

## Atomic Semantics (CRITICAL)

The call is **all-or-nothing**. If ANY id in the array is invalid, NOTHING is deleted — even valid IDs earlier in the array are preserved. Always validate IDs before calling, or be prepared to handle the case where a partially-bad array deletes nothing.

## Instance Position After Deletion

Deleting a constraint does NOT move the constrained instance. The instance stays at its last solver-computed position. The instance becomes unconstrained (free-floating), but its world transform is preserved.

This applies to all constraint types:
- Deleting a `fastened` → inst2 stays at its offset position
- Deleting a `fastenedOrigin` → the grounded instance stays at origin
- Deleting a `revolute` → inst2 stays at its current rotation angle

## What Gets Preserved

- **Deleting a gear/group relation** does NOT delete the underlying constraints or instances. Only the relation linkage is removed.
- **Deleting a group** does NOT delete the grouped instances. Only the organizational metadata is removed.
- **Undeleted constraints** in the same assembly are completely unaffected.

## Empty Array

`deleteConstraint({ ids: [] })` is a silent no-op. Returns `maxLevel: 31`, no error.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"An element of parameter 'ids' has an invalid id!"` | 1006 | Non-existent ID, already-deleted ID |
| `"The parameter 'ids' has a wrong id type! Provide only following id types: ['constraint','relation']"` | 1001 | Instance ID, assembly ID, template ID, or any non-constraint/relation type |

Double-deleting an already-deleted constraint produces the same 1006 error as a non-existent ID.

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
const wcs = (await api.v1.part.workCSys({
  id: tpl, name: 'Csys', origin: [0, 0, 0],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result
await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'A' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'B',
  transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcs } })

const fId = (await api.v1.assembly.fastened({
  id: asmId, name: 'Joint',
  mate1: { path: [inst1], csys: wcs },
  mate2: { path: [inst2], csys: wcs },
  xOffset: 80,
})).result

// Delete the constraint — inst2 stays at x=80
await api.v1.assembly.deleteConstraint({ ids: [fId] })

// Batch delete: mix of constraint types
// await api.v1.assembly.deleteConstraint({ ids: [fastenedId, revoluteId, gearId] })
```

## Related

- `assembly.fastened` / `assembly.revolute` / etc. — create the constraints this deletes
- `assembly.deleteInstance` — deletes instances (different from deleting constraints)
- `assembly.gear` / `assembly.group` — relation types this can also delete
