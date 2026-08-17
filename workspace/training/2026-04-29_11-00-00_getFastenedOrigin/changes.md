# Skill Changes — getFastenedOrigin

## New file: `references/assembly/getFastenedOrigin.md`

```diff
+# assembly.getFastenedOrigin
+
+Retrieves a fastenedOrigin constraint by name from an assembly. Returns the full constraint state including all mate, offset, and rotation values.
+
+## Prerequisites
+- An assembly with at least one fastenedOrigin constraint
+- The constraint name (exact match required)
+
+## Key Parameters
+- `id` (required) — assembly ID or sub-assembly instance ID
+- `name` (required) — constraint name, returns first match if duplicates exist
+
+## Return Value — all fields always present, defaults included explicitly
+## ID Acceptance Rules — assembly IDs and sub-assembly instance IDs work; part instance/constraint/template IDs fail
+## Batch Retrieval — pass array of params, get array of results
+## Constraint Scope — scoped to creating assembly
+## Gotchas — radians always, first match wins, name exact match, rename loses old name, UCT stores values
+## Common Errors — 5 error patterns documented with codes
+## Working Example + Related APIs
```

## Modified: `references/assembly/fastenedOrigin.md`

```diff
-- **`getFastenedOrigin` requires assembly ID.** Passing an instance ID returns null with maxLevel 51. Passing a nonexistent name also returns null with maxLevel 51.
++ **`getFastenedOrigin` accepts assembly IDs and sub-assembly instance IDs.** Part instance IDs fail with "not a Assembly". Passing a nonexistent name returns null with maxLevel 51.
```

Correction: the previous claim that instance IDs always fail was wrong. Sub-assembly instance IDs resolve to their template and work correctly. Only part instance IDs fail.
