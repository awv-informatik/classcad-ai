# Changes — assembly.fastened training

## New file: `references/assembly/fastened.md`

```diff
+# assembly.fastened
+
+Creates a rigid constraint between two instances, locking their relative position and orientation via their work coordinate systems. The constraint solver repositions mate2's instance to satisfy the constraint — any initial `transformation` set on the instance is overridden.
+
+## Prerequisites
+
+- A root assembly (`assembly.create`)
+- At least two instances with work coordinate systems in their templates
+- Must be in assembly context (`setCurrentProduct({ id: asmId })`)
+
+## Key Parameters
+
+- `id` (required) — assembly ID where the constraint is created
+- `mate1` / `mate2` (both required) — each has:
+  - `path` (required) — array with instance ID(s). For top-level instances: `[instId]`. For sub-assembly children: use the expanded tree child ID directly `[etChildId]` — do NOT use `[parentInst, childInst]`
+  - `csys` (required) — work coordinate system ID from the instance's template
+  - `flip` (optional) — `'Z'` | `'-Z'` | `'X'` | `'-X'` | `'Y'` | `'-Y'` (default `'Z'`). Defines the main axis alignment of the mate
+  - `reorient` (optional) — `'0'` | `'90'` | `'180'` | `'270'` (default `'0'`). Rotation around the main axis in 90° steps. Values are strings
+- `xOffset` / `yOffset` / `zOffset` (optional, default 0) — positional offset from mate1 to mate2
+- `xRotation` / `yRotation` / `zRotation` (optional, default 0) — rotation of mate2 around mate1's axes. Accepts `real` (radians) OR `string` with degree suffix (e.g., `'45deg'`, `'90deg'`)
+- `name` (optional, default `'Fastened'`) — constraint name. Duplicates allowed
+- `useCurrentTransform` (optional, default FALSE) — when TRUE, ignores offset/rotation params and reverse-computes them from the instances' current positions
+
+## Return Value
+
+- **Single call:** numeric constraint ID
+- **Batch call (array param):** array of constraint IDs
+- **On error:** `null` (VOID), maxLevel 51
+- **On success:** maxLevel 31 (info level)
+
+## Mate Path Semantics
+
+- **Top-level instances:** `path: [instanceId]` — single-element array
+- **Sub-assembly children (expanded tree):** `path: [etChildId]` — use the CC_ProductReferenceET ID directly
+- **Do NOT use multi-element paths like `[parentInst, etChild]`**
+- **Do NOT pass template IDs in path**
+
+## Gotchas
+
+- Constraint overrides instance transformation
+- Self-constraint blocked (same rigid set error)
+- Duplicate names allowed, getFastened returns first match
+- WCS must belong to the template
+- fastenedOrigin and fastened can coexist
+
+## Common Errors (7 documented)
+## Working Example (full create → constrain workflow)
+## Related (5 cross-references)
```
