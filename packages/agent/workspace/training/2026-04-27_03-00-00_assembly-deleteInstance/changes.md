# Changes: assembly.deleteInstance training

## Modified: `references/assembly/deleteInstance.md`

```diff
-Deletes instances from root assembly, other instances, or assembly templates.
+Deletes instances from root assembly, assembly instances, or assembly templates.

-- Existing instance IDs to delete
+- One or more valid instance IDs (from `assembly.instance` or `assembly.getInstance`)

-- `ids` (required) — array of instance IDs (or ident strings) to delete. Only accepts instance-type IDs.
+- `ids` (required) — array of instance IDs to delete. Accepts:
+  - Numeric IDs (from `instance()` return value or `getInstance()`)
+  - Ident strings (assigned via `ident` param on `instance()` or `setIdent()`)
+  - Name strings (instance name — resolved like any `string | id` parameter)
+  - **Can mix types in one call** — e.g., `[numericId, 'my_ident', 'InstanceName']`

+## All-or-Nothing Semantics (NEW SECTION)
+Pre-validation failure = total rollback. Execution-time failure = partial success.

+## Bidirectional Propagation (NEW SECTION)
+Expanded-tree → template + siblings. Template → all instances.

+## Gotchas (EXPANDED)
+- Snapshots don't reflect instance deletion (template geometry persists)
+- Duplicate IDs cause partial failure
+- Assembly remains usable after deletion

+## Common Errors (NEW SECTION)
+5 error messages with exact text and codes

+## Working Example (EXPANDED)
+Full setup + multiple deletion patterns
```
