# assembly.group

Group constraint: instances move as one rigid set under the constraint solver — moving one grouped instance with `moveUnderConstraints` moves the others by the same translation/rotation.

Prerequisites: assembly root, at least one instance.

## Key Parameters

- `id` — assembly root ID (required)
- `instanceIds` — instance IDs to group (required, at least one valid ID)
- `name` — default `"Group"`

## What Group IS and IS NOT

**IS:** a rigid coupling for the solver. A (x=0) and B (x=30) grouped, then `startMovingUnderConstraints({ instanceIds: [A], mucType: 'TRANSLATION_2D', pivotInfo: [0,0,0] })` + `moveUnderConstraints({ offset: [50,20,0] })` → A at [50,20,0], B at [80,20,0].

**IS NOT:** applied by direct placement. `transformInstance`/`transformInstanceTo` set one transform without running the solver; grouped partners stay put until the next solve.

## Return Value

Group constraint ID; array call → `Array<id>`. `group`, `updateGroup`, and `getGroup` all accept arrays of param objects and return arrays.

## Permissive Behavior

- Single instance — allowed
- Duplicates — `instanceIds: [A, A, B]` is stored as-is (not deduplicated)
- The same instance can be in several groups; instances with fastened/revolute/any constraint can be grouped
- `instanceIds: []` — returns an ID but raises maxLevel 61 (FATAL) "No instances were provided for the Group constraint"; creates a degenerate group
- Deleting a grouped instance **auto-prunes** it from `instanceIds`; deleting ALL of them removes the group

## updateGroup

`updateGroup({ id: groupId, ... })` — **group constraint ID**, not the assembly ID (→ 1007 "not a constraint or relation"). True partial update:

- `name` — old name immediately unfindable via getGroup
- `instanceIds` — **full replacement** of the member list, not additive

## getGroup

`getGroup({ id: asmId, name })` — `id` is the assembly holding it: the root, an assembly template, or a sub-assembly instance (part instance → "not a Assembly", part template → 1001); `name` case-sensitive. Success (maxLevel 31): `{ id, instanceIds, name }`. `result: null`, maxLevel 51 for: non-existent name, empty name, part instance/template ID as `id`.

## Common Errors

| Cause | Message | Code |
|---|---|---|
| Missing instanceIds | "must be provided" | 1004 |
| Invalid instance ID | "invalid id!" | 1006 |
| Assembly ID for updateGroup | "not a constraint or relation" | 1007 |
| Instance/template ID for getGroup | "not a Assembly" | 0 |
| Name not found | "couldn't be found a constraint with name..." | 0 |
| Empty instanceIds array | "No instances were provided" (FATAL, level 61) | 0 |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplA = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
await api.v1.part.box({ id: tplA, name: 'Box', length: 40, width: 30, height: 20 })
const tplB = (await api.v1.assembly.partTemplate({ name: 'Part2' })).result
await api.v1.part.cylinder({ id: tplB, name: 'Cyl', height: 25, diameter: 16 })
await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'I1' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'I2',
  transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

const groupId = (await api.v1.assembly.group({ id: asmId, name: 'Subunit', instanceIds: [inst1, inst2] })).result
await api.v1.assembly.updateGroup({ id: groupId, name: 'Assembly_Left' })  // rename
const g = (await api.v1.assembly.getGroup({ id: asmId, name: 'Assembly_Left' })).result
// { id: groupId, instanceIds: [inst1, inst2], name: 'Assembly_Left' }
```

## Related

`assembly.gear` · `assembly.fastened` · `assembly.deleteConstraint`
