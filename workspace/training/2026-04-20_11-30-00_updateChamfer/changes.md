# Skill Changes — part.updateChamfer

## Updated file: `references/part/chamfer.md`

```diff
 Can update:
-- `distance1`, `distance2`, `angle` — change dimensions
-- `type` — switch between EQUAL_DISTANCE, TWO_DISTANCES, DISTANCE_ANGLE (provide the new type's specific params)
+- `distance1`, `distance2`, `angle` — change dimensions. Accepts `@expr.NAME` strings — you can add expression bindings post-creation and revert to numeric values later.
+- `type` — switch between all 3 types freely. When switching without providing type-specific params, creation defaults apply (`distance2=2`, `angle=C:PI/4`). The existing `distance1` is preserved.
 - `references` — change which edges are chamfered (requires post-recalc edge IDs from current geometry)
 - `name` — rename the feature

+### updateChamfer Gotchas
+
+- **Must call `openFeature` first.** Without it: result=null, maxLevel=51, error code 1200 "The provided feature is not allowed to update. It's not active and open."
+- **Can make valid chamfers degenerate.** Updating to an oversized distance produces the same `maxLevel=51` / "Chamfer could not be applied to all edges." error as creation. Always check maxLevel after update.
+- **Can rescue degenerate chamfers.** If a chamfer is in a failed state (oversized distance), opening it and updating to a valid distance restores it (maxLevel drops to 31). No need to delete and recreate.
+- **Type-irrelevant params are silently ignored.** Setting `distance2` or `angle` when type is EQUAL_DISTANCE succeeds (maxLevel=31) but has no effect.
+- **Multiple sequential updates work.** Repeated open→update→close cycles on the same feature are fine — no state accumulation or degradation.
```
