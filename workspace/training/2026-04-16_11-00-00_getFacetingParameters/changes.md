# Changes — getFacetingParameters & setFacetingParameters

## New files

- `references/common/getFacetingParameters.md` — LLM doc for getFacetingParameters (38 lines)
- `references/common/setFacetingParameters.md` — LLM doc for setFacetingParameters (90 lines)

## Diff

```diff
diff --git a/references/common/getFacetingParameters.md b/references/common/getFacetingParameters.md
new file mode 100644
--- /dev/null
+++ b/references/common/getFacetingParameters.md
@@ -0,0 +1,38 @@
+# common.getFacetingParameters
+
+Returns the current tessellation parameters: `angleTol` and `chordHeightTol`. No parameters required. This is a convenience accessor — the same values are available (alongside 6 other fields) via `getDatabaseSettings`.
+
+## Return Value
+
+```js
+{
+  result: { angleTol: real, chordHeightTol: real },
+  messages: [],
+  maxLevel: 31
+}
+```
+
+Always returns exactly two fields. No extra properties.
+
+## Defaults
+
+| Field | Default | Meaning |
+|---|---|---|
+| `angleTol` | 0 | Max angle (degrees) between adjacent tessellation surfaces. 0 = disabled. |
+| `chordHeightTol` | 0.1 | Max distance between geometry and tessellated arc. Lower = finer mesh. |
+
+## Relationship to getDatabaseSettings
+
+Same backing store. `getFacetingParameters` returns 2 fields, `getDatabaseSettings` returns all 8 (including `facetingParamsMode`, `doCurveTessellation`, etc.). Changes via `setFacetingParameters` or `setDatabaseSettings` are visible from both getters.
+
+## Working Example
+
+```js
+const fp = (await api.v1.common.getFacetingParameters()).result
+// fp = { angleTol: 0, chordHeightTol: 0.1 }
+```
+
+## Related
+
+- `common.setFacetingParameters` — write counterpart (requires both params)
+- `common.getDatabaseSettings` — superset that includes facetingParamsMode and other fields

diff --git a/references/common/setFacetingParameters.md b/references/common/setFacetingParameters.md
new file mode 100644
--- /dev/null
+++ b/references/common/setFacetingParameters.md
@@ -0,0 +1,90 @@
+# common.setFacetingParameters
+
+Sets the tessellation parameters (`angleTol` and `chordHeightTol`) for the current drawing. **Both parameters are required** — omitting either causes a NullMem error.
+
+## Prerequisites
+
+None — works on any drawing state, even empty.
+
+## Key Parameters
+
+| Param | Type | Required | Description |
+|---|---|---|---|
+| `angleTol` | real | **YES** | Max angle (degrees) between adjacent tessellation surfaces. 0 = disabled. Must be 0 or >= 1.0. |
+| `chordHeightTol` | real | **YES** | Max distance between geometry and tessellated arc. Must be > 0 (unless angleTol > 0, then 0 is accepted). |
+
+**Both params must be provided in every call.** This is NOT a partial-update API — unlike `setDatabaseSettings`, you cannot set just one field.
+
+## Return Value
+
+Returns null (VOID). maxLevel=31 on success, maxLevel=51 on error.
+
+## Validation Rules
+
+| Input | Behavior |
+|---|---|
+| Both params, valid values | ✅ Applied (maxLevel=31) |
+| Only one param provided | ❌ NullMem error (maxLevel=51) |
+| `{}` (empty) | ❌ Error (maxLevel=51) |
+| `angleTol` in (0, 1) exclusive | ❌ Rejected (maxLevel=51). Must be 0 or >= 1.0 |
+| `chordHeightTol: 0` with `angleTol > 0` | ✅ Accepted |
+| Both zero | ❌ "Not allowed to set both angleTol and chordHeightTol to 0" |
+| Negative values | ⚠️ Silently ignored — maxLevel=31 but value unchanged |
+| Very large values (1000, 360) | ✅ Accepted and stored |
+| Wrong type (string) | ❌ Code 1001 "wrong type! should be (real)" |
+| Unknown param names | ❌ Error (maxLevel=51) — NullMem because required params missing |
+
+## Differences from setDatabaseSettings
+
+| Behavior | setFacetingParameters | setDatabaseSettings |
+|---|---|---|
+| Partial updates | ❌ Both params required | ✅ Omitted fields untouched |
+| Empty `{}` | ❌ Error (maxLevel=51) | ✅ No-op (maxLevel=31) |
+| `chordHeightTol: 0` | ✅ Accepted (if angleTol > 0) | ❌ Error (maxLevel=51) |
+| Unknown params | ❌ Error | ✅ Silently ignored |
+| Scope | Only angleTol + chordHeightTol | All 8 database settings |
+
+## Cross-talk
+
+Both APIs share the same backing store. Changes via one are visible from the other.
+
+`setFacetingParameters` does NOT modify `facetingParamsMode` or any other database setting — only the two faceting values.
+
+## Persistence
+
+Worker-level state. Survives `common.clear()` and `part.create()`. NOT saved to OFB files.
+
+## Gotchas
+
+- **Both params are mandatory** despite the API docs marking them as optional.
+- **angleTol minimum is 1.0 degree** (when non-zero). Values like 0.5 are rejected. Use 0 to disable.
+- **Negative values are silently swallowed** — no error, no change.
+- **Zero chordHeightTol is valid here** but invalid in `setDatabaseSettings`.
+- Use `setDatabaseSettings` instead if you want partial updates or need to set `facetingParamsMode`.
+
+## Related
+
+- `common.getFacetingParameters` — read counterpart
+- `common.getDatabaseSettings` / `common.setDatabaseSettings` — superset API for all 8 settings
+- `common.setAppearance` — per-entity tessellation overrides (when facetingParamsMode=1)
```
