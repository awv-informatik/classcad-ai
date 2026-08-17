# Changes — assembly.gear

## New file: `references/assembly/gear.md`

```diff
+# assembly.gear
+
+Creates a gear relation that couples the Z-rotation of two revolute constraints in a fixed ratio. When one constraint rotates, the other rotates proportionally according to the ratio. Gear relations are `CC_GearRelation` objects stored in the assembly's `ConstraintSet`.
+
+## Prerequisites
+
+- A root assembly (`assembly.create`)
+- Two **revolute** constraints already created. Gear relations ONLY accept revolute constraint IDs — cylindrical, fastened, fastenedOrigin, and all other constraint types are rejected with error code 1001.
+
+## Key Parameters
+
+- `id` (required) — assembly ID where the gear relation is created
+- `constr1Id` (required) — ID of the first revolute constraint
+- `constr2Id` (required) — ID of the second revolute constraint
+- `ratio` (optional, default 1) — rotational velocity ratio: `d(constr2.zRotationValue) / d(constr1.zRotationValue)`. Accepts any number including 0, negative, and very large values
+- `offset` (optional, default 0) — angular offset of the second mate in radians. Also accepts degree expressions as strings: `'45deg'`, `'90deg'`, `'135deg'`
+- `name` (optional, default `'GearRelation'`) — name for the gear relation
+
+## Return Value
+
+- **Single call:** numeric gear relation ID (maxLevel 31)
+- **Batch call (array param):** array of IDs
+- **On error:** `null` (VOID), maxLevel 51
+
+## Batch Creation
+
+Pass array of param objects: `gear([{...}, {...}])`. Returns array of IDs.
+
+## getGear
+
+`getGear({ id: asmId, name: 'gearName' })` — retrieves gear relation by name.
+Returns: `{ id, name, constr1Id, constr2Id, ratio, offset }`
+
+## updateGear
+
+`updateGear({ id: gearId, ... })` — update any property by gear relation ID.
+
+## Deleting Gear Relations
+
+Use `deleteConstraint({ ids: [gearId] })`. Cascade: deleting an underlying revolute also deletes the gear.
+
+## Gotchas
+
+- Revolute constraints only (code 1001 for others)
+- Same constraint for both IDs accepted silently
+- Zero and negative ratios accepted
+- Cascade deletion on revolute removal
+- Offset stored in radians internally
+- `ids` not `id` for deleteConstraint
+
+## Common Errors, Internal Structure, Working Example, Related — see full file
```
