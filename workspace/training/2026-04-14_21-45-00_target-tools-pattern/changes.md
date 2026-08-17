# Changes — target/tools pattern study

## New file: `references/solid/target-tools-pattern.md`

```diff
+# The target/tools/keepTools Pattern
+
+Cross-cutting reference for the boolean operation pattern shared by `solid.union`, `solid.subtraction`, `solid.intersection`, and `solid.merge`. All four operations use identical parameter signatures and follow the same conventions.
+
+## Signature
+
+```js
+api.v1.solid.<op>({ id, target, tools, keepTools? })
+```
+
+| Parameter | Type | Default | Description |
+|---|---|---|---|
+| `id` | EIF ID | required | Must be a valid entity injection feature. See "id parameter semantics" below. |
+| `target` | solid ID | required | The base solid. Modified in place. Its ID is returned on success. |
+| `tools` | solid ID[] | required | Solids to apply to the target. Consumed (deleted) by default. |
+| `keepTools` | boolean | `false` | When `true`, tool IDs remain valid after the operation. |
+
+## Return Value
+
+All four operations return the **target solid ID** on success (not a new ID). maxLevel=31, messages=[].
+
+Exception: `subtraction` and `intersection` can return `null` with maxLevel=51 if the operation destroys the target (code 1014).
+
+## Universal Behaviors (verified for all 4 operations)
+
+- keepTools: uniform across all 4
+- Empty tools: silent no-op for all 4
+- Tool ordering: does not affect result
+- Multi-tool vs sequential: equivalent results
+- Target ID stability: stable across mixed chains
+- Invalid tool IDs: uniform error handling
+- Self-referencing: server hang (critical)
+- Cross-EIF operations: all 4 support cross-EIF tools
+- id parameter: must be valid EIF, but doesn't need to match target/tools EIF
+
+## Key findings:
+- id param doesn't scope the operation — any valid EIF works
+- Destroyed targets handled inconsistently (translation=silent no-op, union=null error, merge=misleading return)
+- Tool reuse across different operation types works with keepTools: true
```
