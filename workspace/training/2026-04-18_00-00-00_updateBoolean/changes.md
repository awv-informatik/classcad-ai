# Changes — part.updateBoolean training

## Updated file

`references/part/updateBoolean.md`

## Diff

```diff
-Updates an existing boolean feature. Can change the operation type and name. Requires the `openFeature`/`closeFeature` gate.
+Updates an existing boolean feature. Can change the operation type, name, target, and tools. Requires the `openFeature`/`closeFeature` gate.

+- New target/tools must exist **before** the boolean in the design tree (see Gotchas)

-- `target` — object `{id, indices}` to change the base feature (optional)
-- `tools` — array to change tool features (optional)
+- `target` — object `{id, indices?}` to change the base feature (optional)
+- `tools` — array of feature IDs or `[{id, indices?}]` objects to change tool features (optional)
+
+All optional params can be combined in a single call (e.g., change type + name simultaneously).

-Returns the boolean feature ID (same ID as input). maxLevel=31 on success.
+Returns the boolean feature ID (same ID as input, never changes). maxLevel=31 on success.
+
+## Target & Tool Swapping
+
+When you change `target` or `tools`, the old features are **released** (become unconsumed and available again) and the new features are **consumed**. This is bidirectional — you can swap features in and out of a boolean freely, as long as the replacement features exist before the boolean in the design tree.
+
+- Changing from 1 tool to 2 tools works — tool count is flexible
+- Old tools become visible unconsumed features after the swap
+- Target swap releases the old target and consumes the new one

+// Change target and tools
+// Sequential updates — each needs its own open/close cycle
+(added multiple usage patterns)

-- **`openFeature` is mandatory.** Without it: error code 1200 ...
+- **`openFeature` is mandatory.** Without it: error code 1200 ... followed by code 1004 ... Result is null, maxLevel=51.
+- **Feature ordering constraint.** `openFeature` rolls back the design tree to just before the boolean. Features created AFTER the boolean do not exist in the rolled-back state and cannot be used as new targets/tools.
+- Name-only changes do not affect geometry.

+## Common Errors (new section — 4 error patterns documented)
+## Working Example (new section — realistic bracket workflow with tool swap)
```

## Summary

Major expansion from a thin placeholder to a comprehensive doc. Key additions:
- Target & tool swapping behavior (release/consume semantics)
- Feature ordering constraint (critical gotcha discovered via script 15/16)
- Common errors table with 4 error patterns
- Working example with realistic workflow
- Sequential update pattern documented
