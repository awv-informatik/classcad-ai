# Changes: assembly.getInstance

Updated `knowledge/classcad-skill/references/assembly/getInstance.md` with verified findings.

## Key changes

```diff
-Returns instances belonging to an owner (root assembly, assembly instance, or assembly template).
+Returns instances belonging to an owner. Supports lookup by name (single result) or listing all (array result).

-- `ownerId` (required) — the parent to search in. Must be assembly or instance type (not part template).
-- `name` (optional) — filter by instance name. If omitted, returns ALL instances.
+- `ownerId` (required) — the parent to search in. Accepts:
+  - Root assembly ID
+  - Assembly template ID
+  - Assembly instance ID (returns expanded-tree children)
+  - **Not accepted:** part template IDs → error "wrong id type"
+- `name` (optional) — filter by instance name. Changes return type.

-## Return Value (bullet list)
+## Return Value (table with all modes and types documented)

+## Batch Form (new section)
+Unlike `assembly.instance`, batch `getInstance` does NOT fail all-or-nothing.
+Individual not-found entries return `[]` without affecting other results.

+## Gotchas (expanded with verified findings)
+- Expanded-tree children have DIFFERENT IDs than template children
+- Direct children only, not recursive
+- Assembly templates count as "assembly" type

+## Common Errors (new section with exact error messages)

+## Working Example (expanded: full setup, not-found case, batch with mixed results)
```
