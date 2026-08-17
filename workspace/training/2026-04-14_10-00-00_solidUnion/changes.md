# Changes — solid.union training

## New file: `references/solid/union.md`

```diff
+# solid.union
+
+Combines two or more solids into a single solid by boolean union. The target solid is modified in place — tool solids are consumed (deleted) by default.
+
+## Prerequisites
+
+- A part (`part.create`)
+- An entity injection feature (`part.entityInjection`)
+- At least two solids in the same EIF
+
+## Key Parameters
+
+- `id` — entity injection feature ID (not part ID)
+- `target` — solid ID to use as the base. This solid is modified in place and its ID is returned.
+- `tools` — array of solid IDs to union into the target. All tools are consumed (deleted) unless `keepTools: true`.
+- `keepTools` — boolean, default `false`. When `true`, tool solids remain as separate, valid solids after the union. When `false` (default), tool solid IDs become invalid immediately after the call.
+
+## Return Value
+
+Returns the **target solid ID** (not a new ID). maxLevel=31 on success, messages=[].
+
+## Gotchas
+
+- **CRITICAL: Never pass the same solid as both target and tool.** Hangs the server (100% CPU, infinite loop).
+- **Consumed tools are gone.** Referencing consumed tool IDs errors with code 1006, level 51.
+- **Non-overlapping bodies succeed silently.** Creates a compound/disjoint solid.
+- **Empty tools array is a no-op.**
+
+## Usage Hints, Common Errors, Working Example, Related
+(full content in file)
```
