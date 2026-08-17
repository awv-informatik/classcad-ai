# Changes — solid.subtraction training

## New file: `references/solid/subtraction.md`

```diff
+# solid.subtraction
+
+Cuts tool solids from a target solid (boolean subtract). The target is modified in place — tool solids are consumed (deleted) by default.
+
+## Prerequisites
+
+- A part (`part.create`)
+- An entity injection feature (`part.entityInjection`)
+- At least two solids in the same EIF (one target, one or more tools)
+
+## Key Parameters
+
+- `id` — entity injection feature ID (not part ID)
+- `target` — solid ID to cut from. This solid is modified in place and its ID is returned on success.
+- `tools` — array of solid IDs to use as cutting tools. All tools are consumed (deleted) unless `keepTools: true`.
+- `keepTools` — boolean, default `false`. When `true`, tool solids remain as separate, valid solids after the subtraction.
+
+## Return Value
+
+- **Success:** Returns the **target solid ID**. maxLevel=31.
+- **Target destroyed:** Returns `null` (VOID). maxLevel=51, code 1014: "Target solid was removed by subtraction."
+- **Empty tools:** Returns target ID unchanged (no-op).
+
+## Gotchas
+
+- **CRITICAL: Never pass consumed solid IDs to any solid operation.** Hangs the server.
+- **Non-overlapping tools are silent no-ops.** Target unchanged, tool consumed.
+- **Tool enveloping target destroys it.** result=null, maxLevel=51.
+- **Empty tools array is a no-op.**
+
+## Key findings from training:
+- keepTools:true confirmed working — tool can be reused for subsequent subtractions
+- Multiple tools in one call works (3 cylinders subtracted simultaneously)
+- Chained subtractions on same target work — target ID stable throughout
+- Subtraction from compound solid (union result) works fine
+- solid.translation on consumed tool ID hangs server (same as self-union hang)
```
