# Changes — assembly.getRevolute

## New file: `references/assembly/getRevolute.md`

```diff
+# assembly.getRevolute
+
+Retrieves a revolute constraint by name from an assembly. Returns the full constraint definition including both mates, offset, and rotation limits.
+
+## Prerequisites
+
+- An assembly with at least one revolute constraint
+- The constraint name (exact match required)
+
+## Key Parameters
+
+- `id` (required) — the **assembly ID** or a **sub-assembly instance ID**. Part instance IDs, constraint IDs, and part template IDs all fail.
+- `name` (required) — constraint name to look for. Returns first match if duplicates exist.
+
+## Return Value
+
+On success (maxLevel 31):
+
+```js
+{
+  id: number,         // constraint ID
+  name: string,       // constraint name
+  mate1: {
+    path: number[],   // instance ID(s)
+    csys: number,     // WCS ID
+    flip: string,     // "Z" | "-Z" | "X" | "-X" | "Y" | "-Y"
+    reorient: string, // "0" | "90" | "180" | "270"
+  },
+  mate2: {
+    path: number[],   // instance ID(s)
+    csys: number,     // WCS ID
+    flip: string,     // "Z" | "-Z" | "X" | "-X" | "Y" | "-Y"
+    reorient: string, // "0" | "90" | "180" | "270"
+  },
+  zOffset: number,
+  zRotationLimits: {
+    min: number | null,  // radians, null = no limit
+    max: number | null,
+  },
+}
+```
+
+(Full file: 149 lines covering return structure, batch retrieval, ID acceptance rules, constraint scope, gotchas, error catalog, working example, related APIs)
```
