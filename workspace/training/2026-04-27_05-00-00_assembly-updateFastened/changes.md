# Changes — assembly.updateFastened + getFastened

## New files

- `references/assembly/updateFastened.md` (96 lines)
- `references/assembly/getFastened.md` (69 lines)

## Diff

```diff
diff --git a/references/assembly/getFastened.md b/references/assembly/getFastened.md
new file mode 100644
--- /dev/null
+++ b/references/assembly/getFastened.md
@@ -0,0 +1,69 @@
+# assembly.getFastened
+
+Retrieves a fastened constraint by name from an assembly. Returns the full constraint state including all mate, offset, and rotation values.
+
+## Prerequisites
+- An assembly with at least one fastened constraint
+- The constraint name
+
+## Key Parameters
+- `id` (required) — the **assembly ID** (not a constraint or instance ID)
+- `name` (required) — constraint name to look for. Returns first match if duplicates exist.
+
+## Return Value
+On success: { id, name, mate1: { path, csys, flip, reorient }, mate2: {...}, xOffset, yOffset, zOffset, xRotation, yRotation, zRotation }
+On error: null, maxLevel 51
+
+## Gotchas
+- Requires assembly ID, not instance ID
+- Rotations always returned as radians
+- First match wins for duplicate names
+
+## Common Errors
+- "There couldn't be found a constraint with name X" — no match
+- "The provided product or product reference id is not a Assembly" — instance ID instead of assembly ID

diff --git a/references/assembly/updateFastened.md b/references/assembly/updateFastened.md
new file mode 100644
--- /dev/null
+++ b/references/assembly/updateFastened.md
@@ -0,0 +1,96 @@
+# assembly.updateFastened
+
+Updates an existing fastened constraint. All params except `id` are optional — unset params are preserved.
+
+## Key Parameters
+- `id` (required) — constraint ID (NOT assembly ID)
+- name, mate1/mate2 (path, csys, flip, reorient), offsets, rotations, useCurrentTransform
+- Mate sub-properties update independently — partial mate updates preserve unset sub-properties
+
+## Return Value
+- Single: same constraint ID. Batch: array of IDs. Error: null, maxLevel 51.
+
+## Key Findings
+- Partial update: verified all 12+ fields preserved when only 1 is updated
+- useCurrentTransform=true ignores explicit offset/rotation values
+- Can retarget mates to different instances (must provide csys)
+- Name update makes old name unfindable via getFastened
+- Batch update via array works (returns array of IDs)
+- Failed updates don't corrupt existing constraints
+
+## Common Errors
+- code 1007: assembly ID instead of constraint ID
+- code 1006: invalid constraint/csys ID
+- code 1013: invalid flip/reorient value
+- code 1004: missing id param
```
