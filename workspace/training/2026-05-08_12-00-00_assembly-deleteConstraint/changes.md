# Changes — assembly.deleteConstraint

## New file: `references/assembly/deleteConstraint.md`

```diff
+# assembly.deleteConstraint
+
+Deletes constraints and relations from assemblies. Accepts any mix of constraint types (fastened, fastenedOrigin, revolute, cylindrical, planar, parallel, slider, spherical) and relation types (gear, group) in a single call.
+
+## Prerequisites
+
+- An assembly with existing constraints or relations to delete
+
+## Key Parameters
+
+- `ids` — array of constraint/relation IDs to delete (required). Accepts IDs returned from any constraint creation call (`fastened`, `revolute`, `gear`, `group`, etc.).
+
+## Return Value
+
+- `result: null` (VOID) on success
+- `maxLevel: 31` on success (no messages)
+
+## Atomic Semantics (CRITICAL)
+
+The call is **all-or-nothing**. If ANY id in the array is invalid, NOTHING is deleted — even valid IDs earlier in the array are preserved. Always validate IDs before calling, or be prepared to handle the case where a partially-bad array deletes nothing.
+
+## Instance Position After Deletion
+
+Deleting a constraint does NOT move the constrained instance. The instance stays at its last solver-computed position. The instance becomes unconstrained (free-floating), but its world transform is preserved.
+
+This applies to all constraint types:
+- Deleting a `fastened` → inst2 stays at its offset position
+- Deleting a `fastenedOrigin` → the grounded instance stays at origin
+- Deleting a `revolute` → inst2 stays at its current rotation angle
+
+## What Gets Preserved
+
+- **Deleting a gear/group relation** does NOT delete the underlying constraints or instances. Only the relation linkage is removed.
+- **Deleting a group** does NOT delete the grouped instances. Only the organizational metadata is removed.
+- **Undeleted constraints** in the same assembly are completely unaffected.
+
+## Empty Array
+
+`deleteConstraint({ ids: [] })` is a silent no-op. Returns `maxLevel: 31`, no error.
+
+## Common Errors
+
+| Error | Code | Cause |
+|---|---|---|
+| `"An element of parameter 'ids' has an invalid id!"` | 1006 | Non-existent ID, already-deleted ID |
+| `"The parameter 'ids' has a wrong id type! Provide only following id types: ['constraint','relation']"` | 1001 | Instance ID, assembly ID, template ID, or any non-constraint/relation type |
+
+Double-deleting an already-deleted constraint produces the same 1006 error as a non-existent ID.
+
+## Working Example
+
+...working example with fastened constraint creation and deletion...
+
+## Related
+
+- `assembly.fastened` / `assembly.revolute` / etc. — create the constraints this deletes
+- `assembly.deleteInstance` — deletes instances (different from deleting constraints)
+- `assembly.gear` / `assembly.group` — relation types this can also delete
```
