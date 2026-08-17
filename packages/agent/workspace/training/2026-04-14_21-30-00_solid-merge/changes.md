# Changes — solid.merge training session

## New file: `references/solid/merge.md`

```diff
+# solid.merge
+
+Combines multiple solids into a single compound solid by **concatenating their geometry** — no boolean computation. Unlike `union`, merge does NOT resolve overlapping regions. All original faces from every input body are preserved as-is, including internal/double walls where bodies overlap.
+
+Think of merge as "group these bodies under one solid ID" rather than "fuse them into one watertight shape."
+
+## Prerequisites
+
+- A part (`part.create`)
+- An entity injection feature (`part.entityInjection`)
+- At least one target solid and one or more tool solids
+
+## Key Parameters
+
+- `id` — entity injection feature ID (not part ID). Tools can come from a different EIF.
+- `target` — solid ID to use as the base. Modified in place; its ID is returned.
+- `tools` — array of solid IDs to merge into the target. Consumed by default.
+- `keepTools` — boolean, default `false`. When `true`, tool solid IDs remain valid after merge. When `false`, tool IDs become invalid immediately.
+
+## Return Value
+
+Returns the **target solid ID** (not a new ID). maxLevel=31 on success, messages=[].
+
+## Merge vs Union — When to Use Which
+
+| | Merge | Union |
+|---|---|---|
+| **Computation** | Concatenates shells | Computes boolean intersection |
+| **Overlapping faces** | Preserved (double walls) | Resolved (faces split at intersection) |
+| **Vertex/edge count** | Sum of inputs | More (split faces) |
+| **Watertight** | No (if bodies overlap) | Yes |
+| **Speed** | Faster (no kernel computation) | Slower |
+| **Use case** | Grouping bodies, pre-boolean assembly | Clean fused geometry |
+
+## Gotchas
+
+- **CRITICAL: Never pass the same solid as both target and tool.** Hangs the server.
+- **No `updateMerge` exists.**
+- **Overlapping geometry is NOT resolved.**
+- **keepTools works the same as booleans.**
+
+## Common Errors, Usage Hints, Working Example, Related
+
+(See full file for details)
```
