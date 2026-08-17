# Changes — solid.translation training session

## New file: `references/solid/translation.md`

```diff
+# solid.translation
+
+Translates a solid by a given vector in the part's coordinate system. The solid is modified in place — no new solid is created.
+
+## Prerequisites
+
+- A part (`part.create`)
+- An entity injection feature (`part.entityInjection`)
+- A solid in that EIF
+
+## Key Parameters
+
+- `id` — entity injection feature ID (not part ID). Error code 1001 if you pass a part ID.
+- `target` — solid ID to translate. Must be a valid, non-consumed solid. Error code 1001 if wrong type, 1006 if invalid/consumed.
+- `translation` — `[x, y, z]` vector. Coordinates are in the part's local coordinate system. Required — code 1004 if omitted.
+
+## Return Value
+
+Returns the **target solid ID** (same ID, not a new one). maxLevel=31 on success, messages=[].
+
+## Behavior
+
+- **Cumulative.** Each `translation` call adds to the solid's current position.
+- **Zero vector is a no-op.** `[0, 0, 0]` succeeds silently.
+- **Negative values work.**
+- **No upper bound.** Large and fractional values accepted.
+- **Works on compound solids.** Post-boolean union targets translate as one unit.
+- **No `updateTranslation` method exists.**
+
+## Gotchas
+
+- `id` is the EIF ID, not the part ID.
+- Consumed tool solids are invalid targets.
+- Auto-scaling hides single-body translations in snapshots.
+
+## Common Errors table, Working Example, Related APIs included.
```
