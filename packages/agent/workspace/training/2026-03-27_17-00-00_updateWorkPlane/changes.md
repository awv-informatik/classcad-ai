# Changes — part.updateWorkPlane training session

## New file: `references/part/updateWorkPlane.md`

```diff
+# part.updateWorkPlane
+
+Modifies an existing work plane feature. Only the parameters you provide are changed — omitted parameters keep their current values.
+
+## Prerequisites
+- A work plane feature (from `part.workPlane`)
+- The work plane ID (not the part ID)
+- **Must be wrapped in `openFeature` / `closeFeature`** — this is not optional
+
+## The Pattern
+await api.v1.part.openFeature({ id: wpId })
+await api.v1.part.updateWorkPlane({ id: wpId, offset: 50 })
+await api.v1.part.closeFeature({ id: wpId })
+
+(plus Key Parameters, Return Value, Gotchas, Common Errors, Working Example, Related sections — 94 lines total)
```

Key findings documented:
- openFeature/closeFeature gate is mandatory
- Built-in planes can be renamed but not have geometry modified
- Multiple updates work in one open session
- Changing type without references creates broken feature
