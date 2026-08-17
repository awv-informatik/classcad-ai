# Changes — setFacetingParameters (verification session)

## Modified files

- `references/common/setFacetingParameters.md` — clarified unknown params behavior, added extra params gotcha

## Diff

```diff
diff --git a/references/common/setFacetingParameters.md b/references/common/setFacetingParameters.md
index 0e4f77d..6a295c6 100644
--- a/references/common/setFacetingParameters.md
+++ b/references/common/setFacetingParameters.md
@@ -32,7 +32,8 @@ Returns null (VOID). maxLevel=31 on success, maxLevel=51 on error.
 | Negative values | ⚠️ Silently ignored — maxLevel=31 but value unchanged |
 | Very large values (1000, 360) | ✅ Accepted and stored |
 | Wrong type (string) | ❌ Code 1001 "wrong type! should be (real)" |
-| Unknown param names | ❌ Error (maxLevel=51) — NullMem because required params missing |
+| Unknown param names (without valid params) | ❌ NullMem error — required params missing |
+| Unknown param names (with valid params) | ✅ Silently ignored — values applied normally |
 
 ## Differences from setDatabaseSettings
 
@@ -70,6 +71,7 @@ Worker-level state. Survives `common.clear()` and `part.create()`. NOT saved to
 - **angleTol minimum is 1.0 degree** (when non-zero). Values like 0.5 are rejected. Use 0 to disable.
 - **Negative values are silently swallowed** — no error, no change. Always verify with `getFacetingParameters` after setting.
 - **Zero chordHeightTol is valid here** but invalid in `setDatabaseSettings`. The two APIs have inconsistent validation for this edge case.
+- **Extra params are silently ignored** — passing `facetingParamsMode` or any unknown key alongside valid params does not error but has no effect. Only `angleTol` and `chordHeightTol` are processed.
 - Use `setDatabaseSettings` instead if you want partial updates or need to set `facetingParamsMode`.
 
 ## Working Example
```
