# Skill Changes — part.boolean & part.updateBoolean

## New files

- `references/part/boolean.md` — LLM doc for `part.boolean`
- `references/part/updateBoolean.md` — LLM doc for `part.updateBoolean`

## Diff

```diff
diff --git a/references/part/boolean.md b/references/part/boolean.md
new file mode 100644
--- /dev/null
+++ b/references/part/boolean.md
@@ -0,0 +1,97 @@
+# part.boolean
+
+Creates a boolean feature that combines, subtracts, or intersects solid features. This is the **feature-level** boolean — it lives in the design tree, supports `updateBoolean`, and consumes its input features.
+
+## Prerequisites
+
+- A part (`part.create`)
+- At least two solid features (e.g., `part.box`, `part.cylinder`, etc.)
+
+## Key Parameters
+
+- `id` — part ID (not feature ID, not EIF ID)
+- `target` — feature ID of the base solid. Can be a plain ID or `{id, indices}` object. **Consumed** after the operation.
+- `tools` — array of feature IDs to apply. Can be plain IDs `[id1, id2]` or objects `[{id: id1}, {id: id2, indices: [0]}]`. All **consumed** after the operation.
+- `type` — `"UNION"` (default), `"SUBTRACTION"`, or `"INTERSECTION"`
+- `name` — optional custom name. Defaults to `"Union"`, `"Subtraction"`, or `"Intersection"` based on type.
+
+## Return Value
+
+Returns a **new feature ID** — not the target ID.
+
+## Consumption Behavior
+
+**Both target and tool features are consumed.** After `part.boolean`, the original feature IDs are invalid.
+
+## Differences from `solid.*` Booleans
+
+| Behavior | `part.boolean` | `solid.*` |
+|---|---|---|
+| Return value | New feature ID | Target solid ID |
+| Input consumption | Target AND tools consumed | Only tools consumed |
+| Self-reference | **Succeeds safely** | **Hangs server** |
+| Empty tools `[]` | **Error** | Silent no-op |
+| Non-overlapping bodies | **Succeeds silently** | SUB/INT can error |
+
+## Gotchas
+
+- Features are consumed — track the returned feature ID
+- Empty tools is an error, not a no-op
+- No `keepTools` param — tools always consumed
+
+diff --git a/references/part/updateBoolean.md b/references/part/updateBoolean.md
new file mode 100644
--- /dev/null
+++ b/references/part/updateBoolean.md
@@ -0,0 +1,38 @@
+# part.updateBoolean
+
+Updates an existing boolean feature. Can change type and name.
+Requires openFeature/closeFeature gate.
+Returns same feature ID. maxLevel=31 on success.
```
