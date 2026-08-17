# assembly.group

Creates a group constraint that tags instances as belonging together. This is **organizational metadata only** — it does NOT create a kinematic link. Moving one grouped instance does not move others.

## Prerequisites

- An assembly root (`assembly.create`)
- At least one instance

## Key Parameters

- `id` — assembly root ID (required)
- `instanceIds` — array of instance IDs to group (required). Must contain at least one valid ID.
- `name` — group name (default "Group")

## What Group IS and IS NOT

**IS:** A named label saying "these instances belong together." Useful for organizational purposes, BOM grouping, or application-level logic that queries group membership.

**IS NOT:** A kinematic constraint. Moving one grouped instance with `transformInstanceTo` does NOT move the others. Group has zero DOF constraints — no spatial coupling of any kind.

Verified: `transformInstanceTo` on inst1 moved it to y=80 while grouped partner inst2 stayed at y=0. COG measurement confirmed both before/after.

## Return Value

- Single call: `id` — the group constraint ID
- Array call: `Array<id>`

## Permissive Behavior

- **Single instance** — allowed, no error
- **Duplicate instances** — allowed! `instanceIds: [A, A, B]` stores duplicates (not deduplicated)
- **Overlapping groups** — the same instance can belong to multiple groups simultaneously
- **Constrained instances** — instances with fastened, revolute, or any other constraint can be freely grouped
- **Empty instanceIds `[]`** — returns an ID but raises maxLevel 61 (FATAL): "No instances were provided for the Group constraint". Creates a degenerate group.

## Instance Deletion

Deleting a grouped instance **auto-prunes** it from the group's `instanceIds`. When ALL grouped instances are deleted, the group constraint itself is removed.

## updateGroup

`updateGroup({ id: groupId, ... })` — true partial update. Unspecified params are preserved.

**`id` must be the group constraint ID** (returned from `group()`), NOT the assembly ID. Passing assembly ID → error code 1007 "not a constraint or relation".

### What you can update

- `name` — rename the group; old name immediately unfindable via getGroup
- `instanceIds` — replace the member list entirely (this is a full replacement, not additive)

## getGroup

`getGroup({ id: asmId, name: 'MyGroup' })` — queries a group by name.

### Parameters

- `id` — **assembly root ID only**. Instance IDs and template IDs fail with "not a Assembly".
- `name` — group name string (case-sensitive)

### Return Value

Success (`maxLevel: 31`):
```js
{
  id,           // group constraint ID
  instanceIds,  // array of instance IDs
  name,         // string
}
```

Failure (all return `result: null, maxLevel: 51`):
- Non-existent name
- Empty name
- Instance or template ID passed as `id`

## Batch Support

All three methods (`group`, `updateGroup`, `getGroup`) accept an array of param objects. Returns an array of results.

```js
// Create two groups at once
const ids = (await api.v1.assembly.group([
  { id: asmId, name: 'Left', instanceIds: [inst1, inst2] },
  { id: asmId, name: 'Right', instanceIds: [inst3, inst4] },
])).result
// ids → [groupId1, groupId2]
```

## Common Errors

| Error | Message | Code |
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

// Group them (organizational — no kinematic effect)
const groupId = (await api.v1.assembly.group({
  id: asmId, name: 'Subunit', instanceIds: [inst1, inst2],
})).result

// Update membership
await api.v1.assembly.updateGroup({ id: groupId, name: 'Assembly_Left' })

// Query
const g = (await api.v1.assembly.getGroup({ id: asmId, name: 'Assembly_Left' })).result
// g → { id: groupId, instanceIds: [inst1, inst2], name: 'Assembly_Left' }
```

## Related

- `assembly.gear` — links revolute constraints (kinematic relation, unlike group)
- `assembly.fastened` — rigidly locks two instances together (kinematic, unlike group)
- `assembly.deleteConstraint` — can delete a group constraint by ID
