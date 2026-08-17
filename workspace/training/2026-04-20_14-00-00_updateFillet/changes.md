# Skill Changes — part.updateFillet

## Updated file: `references/part/fillet.md`

```diff
+## updateFillet
+
+Requires `openFeature` → `updateFillet` → `closeFeature` pattern. Takes the **fillet feature ID** (not part ID).
+
+Can update:
+- `radius` — change the fillet radius. Accepts numeric values, `@expr.NAME` strings, and inline math. You can add expression bindings post-creation and revert to numeric values later.
+- `references` — change which edges are filleted. Requires post-recalc edge IDs from the current geometry (edge IDs change after any topology-modifying operation).
+- `name` — rename the feature (geometry unchanged).
+
+### updateFillet Gotchas
+
+- **Must call `openFeature` first.** Without it: result=null, maxLevel=51, error code 1200 "The provided feature is not allowed to update. It's not active and open." (plus cascade error code 1004).
+- **Can make valid fillets degenerate.** Updating to an oversized radius produces the same `maxLevel=51` / "Fillet could not be applied to all edges." error as creation. Always check maxLevel after update.
+- **Can rescue degenerate fillets.** If a fillet is in a failed state (oversized radius), opening it and updating to a valid radius restores it (maxLevel drops to 31). No need to delete and recreate.
+- **Multiple sequential updates work.** Repeated open→update→close cycles on the same feature are fine — no state accumulation or degradation. Radius + name can be changed in the same call.
+
+### updateFillet Working Example
+
+```js
+// Update radius
+await api.v1.part.openFeature({ id: filletId })
+await api.v1.part.updateFillet({ id: filletId, radius: 15 })
+await api.v1.part.closeFeature({ id: filletId })
+
+// Move fillet to different edges (must re-query edge IDs first)
+await api.v1.common.recalc({})
+const newEdges = (await api.v1.part.getGeometryIds({
+  id: partId,
+  lines: [{ pos: [0, 30, 40] }],
+})).result.lines
+
+await api.v1.part.openFeature({ id: filletId })
+await api.v1.part.updateFillet({ id: filletId, references: newEdges })
+await api.v1.part.closeFeature({ id: filletId })
+
+// Add expression binding post-creation
+await api.v1.part.openFeature({ id: filletId })
+await api.v1.part.updateFillet({ id: filletId, radius: '@expr.filletR' })
+await api.v1.part.closeFeature({ id: filletId })
+```

 ## Related

-- `part.updateFillet` — modify radius, references, or name after creation
-- `part.chamfer` — flat angled cut instead of rounded edge
+- `part.chamfer` / `part.updateChamfer` — flat angled cut instead of rounded edge
   `part.getGeometryIds` — find brep edge IDs by position
   `part.openFeature` / `part.closeFeature` — required for updateFillet
```
