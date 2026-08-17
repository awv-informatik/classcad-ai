# Skill Changes — createUncommitedObject

## New file: `references/part/createUncommitedObject.md`

```diff
+# part.createUncommitedObject
+
+Creates an empty, uncommitted feature shell in a part. The feature has default member values but no geometry until committed. Used for two-phase feature creation: create the placeholder, then configure and commit.
+
+Also available as `assembly.createUncommitedObject` for assembly constraints.
+
+## Prerequisites
+
+- A part (`part.create`)
+- No other uncommitted feature may exist (singleton — only one at a time)
+
+## Key Parameters
+
+All three parameters are **required** — each produces a clear error when missing.
+
+- `id` — part ID (or assembly ID for the assembly variant)
+- `type` — exact CC_ class name (case-sensitive). See [Valid Types](#valid-types) below.
+- `name` — feature name. Duplicate names with existing features are allowed.
+
+## Return Value
+
+Returns the feature ID (`result: id`). This ID can be used with `openFeature`, the corresponding `update*` API, and `closeFeature`.
+
+## Commit vs Decline
+
+An uncommitted feature must be **committed** (with update) or **declined** (without update) before any other feature can be created.
+
+### Commit (feature persists with geometry)
+
+```js
+const id = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'MyBox' })).result
+await api.v1.part.openFeature({ id })
+await api.v1.part.updateBox({ id, length: 60, width: 40, height: 30 })
+await api.v1.part.closeFeature({ id })
+```
+
+### Decline (feature removed)
+
+```js
+const id = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'Temp' })).result
+await api.v1.part.openFeature({ id })
+await api.v1.part.closeFeature({ id })
+```
+
+## Gotchas
+
+- Singleton constraint — only one uncommitted at a time
+- Blocks all feature creation while pending
+- getFeature requires recalc to find uncommitted features
+- deleteFeature doesn't work — use decline pattern
+- Type strings are case-sensitive
+- CC_Boolean → use CC_Union/CC_Subtraction/CC_Intersection
+- CC_ImportFeature → use CC_Import
+
+## Valid Types
+
+28 part feature types + 5 assembly constraint types documented with CC_ class → API mapping table.
+
+## Working Example, Related APIs included.
```
