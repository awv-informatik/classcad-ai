# assembly.deleteConstraint

Deletes constraints and relations. Any mix of constraint types (fastened, fastenedOrigin, revolute, cylindrical, planar, parallel, slider, spherical) and relation types (gear, group) in one call.

## Key Parameters

- `ids` — required array of constraint/relation IDs (as returned by `fastened`, `revolute`, `gear`, `group`, …). `[]` is a silent no-op (maxLevel 31)

## Return Value

VOID (`null`), maxLevel 31, no messages.

## Atomic Semantics (CRITICAL)

**All-or-nothing.** If ANY id is invalid, NOTHING is deleted — valid IDs in the same array are preserved too. Validate IDs first.

## Effects

- **Instances do NOT move.** They keep their last solved position and become unconstrained: after deleting a `fastened`, inst2 stays at its offset position; after `fastenedOrigin`, the instance stays at the origin; after `revolute`, inst2 keeps its current angle.
- **Deleting a gear/group relation** removes only the linkage/rigid coupling — underlying constraints and grouped instances remain.
- Other constraints in the assembly are unaffected.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"An element of parameter 'ids' has an invalid id!"` | 1006 | Non-existent or already-deleted ID |
| `"The parameter 'ids' has a wrong id type! Provide only following id types: ['constraint','relation']"` | 1001 | Instance, assembly, template, or other non-constraint/relation ID |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
const wcs = (await api.v1.part.workCSys({ id: tpl, name: 'Csys' })).result  // csys at part origin
await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'A' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'B' })).result

const groundId = (await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcs } })).result
const fId = (await api.v1.assembly.fastened({
  id: asmId, name: 'Joint',
  mate1: { path: [inst1], csys: wcs },
  mate2: { path: [inst2], csys: wcs },
  xOffset: 80,
})).result

// Delete (mixed types allowed) — inst2 stays at x=80
await api.v1.assembly.deleteConstraint({ ids: [fId, groundId] })
```

## Related

`assembly.fastened` / `assembly.revolute` · `assembly.deleteInstance` · `assembly.gear` / `assembly.group`
