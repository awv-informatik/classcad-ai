# Changes — assembly.createUncommitedObject

## New file: `references/assembly/createUncommitedObject.md`

```diff
+# assembly.createUncommitedObject
+
+Creates an empty, uncommitted constraint/relation shell in an assembly. The object has default member values but no configuration until committed via `update*`. Used for two-phase constraint creation: create the placeholder, then configure and commit.
+
+## Prerequisites
+
+- An assembly root (`assembly.create`)
+
+## Key Parameters
+
+All three parameters are **required**:
+
+- `id` — assembly root ID
+- `type` — exact CC_ class name (case-sensitive). See [Valid Types](#valid-types) below.
+- `name` — constraint name. Duplicate names with existing constraints are allowed.
+
+## Return Value
+
+Returns the constraint/relation ID (`result: id`). This ID can be used with `part.openFeature`, the corresponding `assembly.update*` API, and `part.closeFeature`.
+
+(full file — 136 lines — new LLM doc covering: commit/decline pattern, valid CC_ types (12 constraint/relation types), error messages, gotchas including no-singleton behavior, working examples for fastened and revolute two-phase creation)
```
