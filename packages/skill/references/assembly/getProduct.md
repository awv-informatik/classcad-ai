# assembly.getProduct

Instance → the template it places. Pass an instance id; get back the id of the `CC_Part` (part template) or `CC_Assembly` (assembly template) that the instance references. Reach for it when you hold an instance (from a selection, `getInstance`, a constraint `path`, a name or `ident`) and need its template: to edit the geometry behind it (`part.*` on the template), to place another copy (`instance({ productId })`), or to tell a part from a sub-assembly. It is the API form of `members.productId.value` on the instance node. Read the tree instead when you need every instance at once (bulk walk, world transforms: [STRUCTURE.md](../STRUCTURE.md)).

```js
const r = await api.v1.assembly.getProduct({ instanceId: 204 })
r.result   // 170: a bare id (CC_Assembly "Sub"), maxLevel 31, no messages
```

What comes back, by instance kind:

| `instanceId` | result |
|---|---|
| root instance of a part template (`A1`, `A2`) | that part template (both → 22) |
| root instance of an assembly template (`S1`, `S2`) | that assembly template (both → 170) |
| instance inside an assembly template (template scope) | its template |
| `CC_ProductReferenceET` from `getInstance({ ownerId: S2 })` | the part template it expands (209 → 22) |
| ET of a sub-assembly nested in a sub-assembly | the INNER assembly template (213 → 170), not a part |

- Result === `tree[instanceId].members.productId.value` on every instance node: fresh, after `common.recalc`, after OFB and STP round trips.
- `instanceId` takes a number, a numeric string (`'198'`), a unique instance name (`'A1'`) or the instance's `ident`.
- Read-only: `currentProduct` / `currentInstance` stay unchanged. `calculateMassProperties` on the instance does not change the result.

## Traps

- **Returns the immediate product, not the leaf part.** For a sub-assembly instance you get the assembly template. Recurse: `getInstance({ ownerId: instanceId })` gives the next level's ET ids; call `getProduct` on each.
- **`node.link` covers part instances only.** The tree's `link` field exists only on instances of PART templates; instances of assembly templates have no `link` key (a root one carries its ET nodes as `children` instead). Code that keys on `link` misses every sub-assembly instance. Use `members.productId.value` or `getProduct`.
- **The result does not say part or assembly.** Classify with `tree[id].class` (`CC_Part` / `CC_Assembly`) or by membership in `getPartTemplate()` / `getAssemblyTemplate()` (both list all templates). Those two go the other way, from a template name to a template id; `getAssemblyTemplate({ name: tree[getProduct(i)].name })` returns the same id.
- **Instance ids only.** A template id (part or assembly), the root, a feature, a solid, a csys or a work plane → 1001. It does not echo a template id back, so it cannot tell you whether an id is a template.
- **Names of nested instances are not unique.** Every ET copy repeats the name of the template-scope instance it expands: `'SA'` → 1014 "not unique". Pass ids below the root.
- **Stale ids throw; they never return a wrong product.** After `deleteInstance`, or a `deleteTemplate` that cascades to the instance → 1006. ET ids die with their parent instance and with the template-scope instance they expand (`deleteInstance([SB])` inside `Sub` removes the SB copy under every `Sub` instance). The next new instance got a fresh id, not the deleted one.
- **No batch form.** `getProduct([{ instanceId: a }, { instanceId: b }])` → evaluation error; `instanceId: [a, b]` → 1001. Loop.
- In a script every failure below throws (maxLevel 51); wrap probes in try/catch.

## Errors

| Input | Code / level | Message |
|---|---|---|
| root, part or assembly template, feature, solid, csys, work plane, template name | 1001 / 51 | `The parameter "instanceId" has a wrong id type! Provide only following id types: ["instance"]` |
| deleted or unknown id (999999) | 0 / 41 + 1006 / 51 | `ToId()/TOID() didn't get an existing or valid id.` + `An element of parameter "instanceId" has an invalid id!` |
| `0` | 1006 / 51 | `An element of parameter "instanceId" has an invalid id!` |
| unknown string | 0 / 41 + 1006 / 51 | `The string "Nope" couldn't be converted to an id. ...` |
| name used by several instances | 1014 / 51 + 1006 / 51 | `... the name of the object is not unique. There are multiple objects with name: "SA"` |
| `{}` | 1004 / 51 | `The parameter "instanceId" must be provided in the api call!` |
| `instanceId: null` | 1001 / 51 | `Set the parameter "instanceId" = VOID is not allowed in this situation!` |
| array param | 0 / 51 | `[Evaluation error in AssemblyAPI_v1.getProduct::PROC:[CCVM::ldm: objId not found]]` |

## Working Example

```js
const asm = (await api.v1.assembly.create({ name: 'Root' })).result
const Plate = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
await api.v1.part.box({ id: Plate, length: 40, width: 30, height: 10 })
const Pin = (await api.v1.assembly.partTemplate({ name: 'Pin' })).result
await api.v1.part.cylinder({ id: Pin, diameter: 8, height: 30 })
await api.v1.assembly.setCurrentProduct({ id: asm })

const Unit = (await api.v1.assembly.assemblyTemplate({ name: 'Unit' })).result
await api.v1.assembly.instance({ productId: Plate, ownerId: Unit })
await api.v1.assembly.instance({ productId: Pin, ownerId: Unit, transformation: [[20, 15, 10], [1, 0, 0], [0, 1, 0]] })
const U1 = (await api.v1.assembly.instance({ productId: Unit, ownerId: asm, name: 'U1' })).result

// instance -> template, one level at a time
const parts = (await api.v1.assembly.getPartTemplate()).result            // [Plate, Pin]
const tpl = (await api.v1.assembly.getProduct({ instanceId: U1 })).result // Unit
for (const et of (await api.v1.assembly.getInstance({ ownerId: U1 })).result) {
  const p = (await api.v1.assembly.getProduct({ instanceId: et })).result // Plate, then Pin
  console.log(et, p, parts.includes(p) ? 'part' : 'assembly')
}

// one more copy of whatever U1 places
const U2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asm, name: 'U2',
  transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
// root volume 13507.936 -> 27015.872
```

## Related

[instance.md](instance.md) · [getInstance.md](getInstance.md) · [getPartTemplate.md](getPartTemplate.md) · [getAssemblyTemplate.md](getAssemblyTemplate.md) · [deleteInstance.md](deleteInstance.md) · [generic.md](generic.md) · [STRUCTURE.md](../STRUCTURE.md) (Assembly anatomy)
