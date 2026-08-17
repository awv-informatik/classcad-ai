# Changes — assembly.group / updateGroup / getGroup

## New files

- `references/assembly/group.md` — LLM doc for `assembly.group`
- `references/assembly/updateGroup.md` — LLM doc for `assembly.updateGroup`
- `references/assembly/getGroup.md` — LLM doc for `assembly.getGroup`

## Diff

```diff
diff --git a/references/assembly/getGroup.md b/references/assembly/getGroup.md
new file mode 100644
+# assembly.getGroup
+Retrieves a group constraint by name from an assembly.
+## Prerequisites
+- A root assembly with at least one group constraint
+## Key Parameters
+- `id` (required) — the **assembly/product ID**. Instance IDs do not work (returns null).
+- `name` (required) — the group name. Case-sensitive.
+## Return Value
+On success: { id, instanceIds, name }
+On not-found: null, maxLevel 51
+## Gotchas
+- Names are case-sensitive
+- Must use assembly/product ID, not instance ID
+- Stale instance IDs after deletion
+- Default name is 'Group'

diff --git a/references/assembly/group.md b/references/assembly/group.md
new file mode 100644
+# assembly.group
+Creates a group constraint that binds instances together.
+CC_GroupConstraint under CC_ConstraintSet.
+## Key Parameters
+- id (required) — assembly ID
+- instanceIds (required) — array of instance IDs only
+- name (optional, default 'Group')
+## Key findings
+- Empty instanceIds triggers FATAL (61) but still creates group
+- Duplicate IDs accepted without dedup
+- No exclusivity — same instance in multiple groups
+- No nesting — groups can't contain groups
+- No cascade deletion on instance removal
+- No openFeature/closeFeature needed

diff --git a/references/assembly/updateGroup.md b/references/assembly/updateGroup.md
new file mode 100644
+# assembly.updateGroup
+Updates an existing group constraint. Partial updates work.
+## Key Parameters
+- id (required) — group constraint ID (not assembly ID)
+- name — rename the group
+- instanceIds — replace grouped instances
+## Key findings
+- Partial update: only specified params change
+- No openFeature/closeFeature required
+- Rename invalidates old name
```
