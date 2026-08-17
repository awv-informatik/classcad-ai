# Changes — assembly.group training

## New file: `references/assembly/group.md`

```diff
+# assembly.group
+
+Creates a group constraint that tags instances as belonging together. This is **organizational metadata only** — it does NOT create a kinematic link. Moving one grouped instance does not move others.
+
+## Prerequisites
+
+- An assembly root (`assembly.create`)
+- At least one instance
+
+## Key Parameters
+
+- `id` — assembly root ID (required)
+- `instanceIds` — array of instance IDs to group (required). Must contain at least one valid ID.
+- `name` — group name (default "Group")
+
+## What Group IS and IS NOT
+
+**IS:** A named label saying "these instances belong together." Useful for organizational purposes, BOM grouping, or application-level logic that queries group membership.
+
+**IS NOT:** A kinematic constraint. Moving one grouped instance with `transformInstanceTo` does NOT move the others. Group has zero DOF constraints — no spatial coupling of any kind.
+
+Verified: `transformInstanceTo` on inst1 moved it to y=80 while grouped partner inst2 stayed at y=0. COG measurement confirmed both before/after.
+
+## Return Value
+
+- Single call: `id` — the group constraint ID
+- Array call: `Array<id>`
+
+## Permissive Behavior
+
+- **Single instance** — allowed, no error
+- **Duplicate instances** — allowed! `instanceIds: [A, A, B]` stores duplicates (not deduplicated)
+- **Overlapping groups** — the same instance can belong to multiple groups simultaneously
+- **Constrained instances** — instances with fastened, revolute, or any other constraint can be freely grouped
+- **Empty instanceIds `[]`** — returns an ID but raises maxLevel 61 (FATAL): "No instances were provided for the Group constraint". Creates a degenerate group.
+
+## Instance Deletion
+
+Deleting a grouped instance **auto-prunes** it from the group's `instanceIds`. When ALL grouped instances are deleted, the group constraint itself is removed.
+
+## updateGroup
+
+`updateGroup({ id: groupId, ... })` — true partial update. Unspecified params are preserved.
+
+**`id` must be the group constraint ID** (returned from `group()`), NOT the assembly ID. Passing assembly ID → error code 1007 "not a constraint or relation".
+
+### What you can update
+
+- `name` — rename the group; old name immediately unfindable via getGroup
+- `instanceIds` — replace the member list entirely (this is a full replacement, not additive)
+
+## getGroup
+
+`getGroup({ id: asmId, name: 'MyGroup' })` — queries a group by name.
+
+### Parameters
+
+- `id` — **assembly root ID only**. Instance IDs and template IDs fail with "not a Assembly".
+- `name` — group name string (case-sensitive)
+
+### Return Value
+
+Success (`maxLevel: 31`):
+```js
+{
+  id,           // group constraint ID
+  instanceIds,  // array of instance IDs
+  name,         // string
+}
+```
+
+Failure (all return `result: null, maxLevel: 51`):
+- Non-existent name
+- Empty name
+- Instance or template ID passed as `id`
+
+## Batch Support
+
+All three methods (`group`, `updateGroup`, `getGroup`) accept an array of param objects. Returns an array of results.
+
+## Common Errors
+
+| Error | Message | Code |
+|---|---|---|
+| Missing instanceIds | "must be provided" | 1004 |
+| Invalid instance ID | "invalid id!" | 1006 |
+| Assembly ID for updateGroup | "not a constraint or relation" | 1007 |
+| Instance/template ID for getGroup | "not a Assembly" | 0 |
+| Name not found | "couldn't be found a constraint with name..." | 0 |
+| Empty instanceIds array | "No instances were provided" (FATAL, level 61) | 0 |
+
+## Working Example + Related APIs included.
```
