# Changes — solid.intersection training

## New file: `references/solid/intersection.md`

```diff
+# solid.intersection
+
+Computes the boolean intersection of solids — keeps only the volume shared by target and tools. The target is modified in place; tool solids are consumed (deleted) by default.
+
+## Prerequisites
+
+- A part (`part.create`)
+- An entity injection feature (`part.entityInjection`)
+- At least two solids in the same EIF that overlap
+
+## Key Parameters
+
+- `id` — entity injection feature ID (not part ID)
+- `target` — solid ID to use as the base. This solid is modified in place and its ID is returned.
+- `tools` — array of solid IDs to intersect with the target. All tools are consumed (deleted) unless `keepTools: true`.
+- `keepTools` — boolean, default `false`. When `true`, tool solids remain as separate, valid solids after the intersection. When `false` (default), tool solid IDs become invalid immediately after the call.
+
+## Return Value
+
+- **Success (overlap exists):** Returns the **target solid ID** (not a new ID). maxLevel=31, messages=[].
+- **No overlap (disjoint bodies):** Returns `null` (VOID). maxLevel=51, error message: `"Target solid was removed by intersection."` (code 1014). The target is destroyed.
+- **Empty tools array:** Returns target ID unchanged (no-op). maxLevel=31.
+
+## Containment Cases
+
+- **Tool fully contains target:** Result = target unchanged (the intersection volume equals the target). No error.
+- **Target fully contains tool:** Result = target shrinks to the tool's shape (the intersection volume equals the tool). No error.
+- **Partial overlap:** Result = the shared volume only. Both flat and curved surfaces preserved where applicable.
+
+## Gotchas
+
+- **Non-overlapping bodies destroy the target.** Unlike union (which creates a compound solid from disjoint bodies), intersection of disjoint bodies produces nothing — the target is removed. Error code 1014.
+- **Consumed tools are gone.** After a default intersection (keepTools=false), tool solid IDs are invalid.
+- **`solid.copy` on intersection results may fail.** Returns null (maxLevel=51).
+- **Multiple tools = n-way intersection.** `tools: [A, B]` produces `target ∩ A ∩ B`.
+- **Empty tools array is a no-op.**
+
+## Usage Hints, Common Errors, Working Examples, Related APIs
+
+(See full file for details — includes keepTools example, chaining pattern, mixed solid types)
```
