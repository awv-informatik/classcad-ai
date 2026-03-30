# Changes — part.updateWorkPoint session

## New file: `references/part/updateWorkPoint.md`

```diff
+# part.updateWorkPoint
+
+Updates an existing work point feature — position, name, type, or references.
+
+## Prerequisites
+
+- A work point feature (from `part.workPoint`)
+- **Must call `part.openFeature` before and `part.closeFeature` after**
+
+## Key Parameters
+
+- **`id`** (required) — work point feature ID (not part ID)
+- **`name`** — new name. Fully replaces old name.
+- **`type`** — change the work point type.
+- **`references`** — new geometry references.
+- **`position`** — new [x,y,z] position. Only meaningful for USERDEFINED type.
+
+## Key Findings
+
+- openFeature/closeFeature required (same as updateWorkAxis, updateWorkCSys)
+- Partial updates work — unset params keep existing values
+- Type changes bidirectional (USERDEFINED ↔ referenced types)
+- Position param silently ignored for referenced types
+- Missing refs on type change returns feature ID but with error level
```
