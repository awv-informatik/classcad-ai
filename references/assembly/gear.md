# assembly.gear

Creates a gear relation that couples the Z-rotation of two revolute constraints in a fixed ratio. When one constraint rotates, the other rotates proportionally according to the ratio. Gear relations are `CC_GearRelation` objects stored in the assembly's `ConstraintSet`.

## Prerequisites

- A root assembly (`assembly.create`)
- Two **revolute** constraints already created. Gear relations ONLY accept revolute constraint IDs — cylindrical, fastened, fastenedOrigin, and all other constraint types are rejected with error code 1001.

## Key Parameters

- `id` (required) — assembly ID where the gear relation is created
- `constr1Id` (required) — ID of the first revolute constraint
- `constr2Id` (required) — ID of the second revolute constraint
- `ratio` (optional, default 1) — rotational velocity ratio: `d(constr2.zRotationValue) / d(constr1.zRotationValue)`. Accepts any number including 0, negative, and very large values
- `offset` (optional, default 0) — angular offset of the second mate in radians. Also accepts degree expressions as strings: `'45deg'`, `'90deg'`, `'135deg'`
- `name` (optional, default `'GearRelation'`) — name for the gear relation

## Return Value

- **Single call:** numeric gear relation ID (maxLevel 31)
- **Batch call (array param):** array of IDs
- **On error:** `null` (VOID), maxLevel 51

## Batch Creation

Pass array of param objects: `gear([{...}, {...}])`. Returns array of IDs.

## getGear

`getGear({ id: asmId, name: 'gearName' })` — retrieves gear relation by name.

Returns: `{ id, name, constr1Id, constr2Id, ratio, offset }`

- `offset` is always returned in radians, even if created with a degree expression
- Not-found returns null + maxLevel 51
- Returns first match if multiple gears share the same name

## updateGear

`updateGear({ id: gearId, ... })` — update any property by gear relation ID.

- All properties updatable: name, constr1Id, constr2Id, ratio, offset
- `id` here is the **gear relation ID** (not the assembly ID)

## Deleting Gear Relations

Use `deleteConstraint({ ids: [gearId] })` — same pattern as other constraints, with `ids` (plural, array).

**Cascade behavior:** if you delete a revolute constraint that a gear relation references, the gear relation is also deleted automatically.

## Gotchas

- **Revolute constraints only.** Error code 1001: `"constr1Id" has a wrong id type! Provide only following id types: ["revoluteconstraint"]"`. Cylindrical, fastened, fastenedOrigin, planar, etc. are all rejected.
- **Same constraint for both IDs is accepted.** Passing the same revolute ID as both `constr1Id` and `constr2Id` succeeds silently (no error). Likely a no-op — the constraint links to itself.
- **Zero and negative ratios are accepted.** No validation — `ratio: 0` and `ratio: -1` both succeed. A negative ratio reverses the rotation direction; zero ratio effectively decouples.
- **Cascade deletion.** Deleting an underlying revolute constraint cascade-deletes any gear relation that references it.
- **Offset stored in radians.** Even when created with `'30deg'`, `getGear` returns `offset: 0.5235987755982988` (π/6). The expression string is preserved in the structure tree but not in the API response.
- **`ids` not `id` for deleteConstraint.** Same as all other constraint types — using `{ id: gearId }` fails silently.

## Common Errors

| Error | Meaning | Code |
|---|---|---|
| `"constr1Id" must be provided` | Missing required param | 1004 |
| `"constr1Id" has a wrong id type! [...revoluteconstraint]` | Non-revolute constraint ID | 1001 |
| `"constr1Id" has an invalid id!` | Nonexistent constraint ID | 1006 |

## Internal Structure

In the structure tree, gear relations are `CC_GearRelation` nodes under `CC_ConstraintSet`:

- `ratio` (real) — the gear ratio
- `offset` (real) — offset in radians (expression field preserves degree string)
- `constr1Value` / `constr2Value` (real) — current rotation values of linked constraints
- `entities` (array of 2 ids) — the two revolute constraint IDs

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'GearAsm' })).result

const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Gear1' })).result
await api.v1.part.cylinder({ id: tpl1, name: 'Wheel', height: 10, diameter: 40 })
const wcs1 = (await api.v1.part.workCSys({
  id: tpl1, name: 'Axis', origin: [0, 0, 5],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Gear2' })).result
await api.v1.part.cylinder({ id: tpl2, name: 'Wheel', height: 10, diameter: 20 })
const wcs2 = (await api.v1.part.workCSys({
  id: tpl2, name: 'Axis', origin: [0, 0, 5],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Gear3' })).result
await api.v1.part.cylinder({ id: tpl3, name: 'Wheel', height: 10, diameter: 30 })
const wcs3 = (await api.v1.part.workCSys({
  id: tpl3, name: 'Axis', origin: [0, 0, 5],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2', transformation: [[30, 0, 0], [1, 0, 0], [0, 1, 0]] })).result
const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'I3', transformation: [[-35, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

const rev1 = (await api.v1.assembly.revolute({
  id: asmId, name: 'Rev1',
  mate1: { path: [inst1], csys: wcs1 },
  mate2: { path: [inst2], csys: wcs2 },
})).result

const rev2 = (await api.v1.assembly.revolute({
  id: asmId, name: 'Rev2',
  mate1: { path: [inst1], csys: wcs1 },
  mate2: { path: [inst3], csys: wcs3 },
})).result

// Gear with 2:1 ratio and 30° offset
const gearId = (await api.v1.assembly.gear({
  id: asmId,
  name: 'MainGear',
  constr1Id: rev1,
  constr2Id: rev2,
  ratio: 2,
  offset: '30deg',
})).result

// Verify
const info = (await api.v1.assembly.getGear({ id: asmId, name: 'MainGear' })).result
// info → { id: gearId, name: 'MainGear', constr1Id: rev1, constr2Id: rev2, ratio: 2, offset: 0.5236 }

// Delete
await api.v1.assembly.deleteConstraint({ ids: [gearId] })
```

## Related

- `assembly.updateGear` — modify gear params after creation
- `assembly.getGear` — retrieve gear relation by name
- `assembly.deleteConstraint` — delete gear relations (use `ids` array)
- `assembly.revolute` — the only constraint type gear relations accept
- `assembly.group` — groups instances together (different mechanism, no rotation coupling)
