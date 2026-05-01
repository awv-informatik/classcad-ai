# assembly.group

Creates a group constraint that binds instances together in an assembly. Groups are `CC_GroupConstraint` objects stored in the assembly's `ConstraintSet`. Unlike kinematic constraints (revolute, cylindrical, etc.), groups have no DOF or motion coupling — they are a logical grouping mechanism.

## Prerequisites

- A root assembly (`assembly.create`)
- At least one instance created with `assembly.instance`

## Key Parameters

- `id` (required) — assembly ID where the group is created. Must be an assembly/product ID — instance IDs are rejected with code 1007.
- `instanceIds` (required) — array of instance IDs to group. Must be instance IDs specifically — template IDs, constraint IDs, and group IDs are all rejected with code 1001. At least one ID is required — empty array `[]` triggers a FATAL (maxLevel 61) error.
- `name` (optional, default `'Group'`) — name for the group constraint

## Return Value

- **Single call:** numeric group constraint ID (maxLevel 31)
- **Batch call (array param):** array of IDs
- **On error:** `null` (VOID), maxLevel 51

## Batch Creation

Pass array of param objects: `group([{...}, {...}])`. Returns array of IDs.

## getGroup

See [getGroup.md](getGroup.md) for full documentation.

## updateGroup

See [updateGroup.md](updateGroup.md) for full documentation.

## Deleting Groups

Use `deleteConstraint({ ids: [groupId] })` — same pattern as other constraints, with `ids` (plural, array).

**No cascade deletion.** Deleting an instance that belongs to a group does NOT delete the group. The group survives with stale (deleted) instance IDs in its `instanceIds` array. This is different from gear relations, which cascade-delete when their revolute constraints are deleted. To clean up, explicitly delete the group with `deleteConstraint`.

## Gotchas

- **instanceIds only accepts instance IDs.** Template IDs, constraint IDs, group IDs — all rejected with code 1001. Error message: `"instanceIds" has a wrong id type! Provide only following id types: ["instance"]`.
- **Empty `instanceIds: []` triggers FATAL (maxLevel 61).** The group IS created (returns an ID) but with the error "No instances were provided for the Group constraint". Avoid.
- **Duplicate instance IDs are accepted.** Passing `[inst1, inst1, inst1]` succeeds silently and stores all three copies. No deduplication.
- **No exclusivity.** The same instance can belong to multiple groups simultaneously.
- **No nesting.** You cannot put a group ID into `instanceIds` — groups cannot contain groups.
- **Mixed valid/invalid IDs fail atomically.** If any ID in `instanceIds` is invalid, the entire call fails (returns null).
- **No cascade deletion.** Deleting instances does not delete the group — it survives with stale IDs.
- **No openFeature/closeFeature needed.** Groups (like gear relations) can be created and updated without the open/close pattern.

## Common Errors

| Error | Meaning | Code |
|---|---|---|
| `"instanceIds" must be provided` | Missing required param | 1004 |
| `"instanceIds" has a wrong id type! [...instance]` | Non-instance ID in array | 1001 |
| `An element of "instanceIds" has an invalid id!` | Nonexistent instance ID | 1006 |
| `The provided id for the assembly is not an assembly id.` | Wrong ID type for `id` param | 1007 |
| `No instances were provided for the Group constraint` | Empty array (FATAL, maxLevel 61) | 0 |

## Internal Structure

In the structure tree, groups are `CC_GroupConstraint` nodes under `CC_ConstraintSet`:

- `instances` (array of ids) — the grouped instance IDs
- `_VERSION` (string) — internal version stamp

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'GroupAsm' })).result

const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
await api.v1.part.box({ id: tpl1, name: 'Box', length: 30, width: 20, height: 15 })

const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Part2' })).result
await api.v1.part.cylinder({ id: tpl2, name: 'Cyl', height: 20, diameter: 15 })

await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
const inst2 = (await api.v1.assembly.instance({
  productId: tpl2, ownerId: asmId, name: 'I2',
  transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]],
})).result
const inst3 = (await api.v1.assembly.instance({
  productId: tpl1, ownerId: asmId, name: 'I3',
  transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
})).result

// Group all three instances
const groupId = (await api.v1.assembly.group({
  id: asmId,
  name: 'MainGroup',
  instanceIds: [inst1, inst2, inst3],
})).result

// Verify
const info = (await api.v1.assembly.getGroup({ id: asmId, name: 'MainGroup' })).result
// info → { id: groupId, instanceIds: [inst1, inst2, inst3], name: 'MainGroup' }

// Delete
await api.v1.assembly.deleteConstraint({ ids: [groupId] })
```

## Related

- `assembly.updateGroup` — modify group after creation
- `assembly.getGroup` — retrieve group by name
- `assembly.deleteConstraint` — delete groups (use `ids` array)
- `assembly.gear` — couples revolute constraints (different mechanism, rotation coupling)
