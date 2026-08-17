# Changes — Message System Training

Updated `references/common/generic.md` with findings from 18 test scripts.

## Diff

```diff
diff --git a/references/common/generic.md b/references/common/generic.md
index 83330e5..4591305 100644
--- a/references/common/generic.md
+++ b/references/common/generic.md
@@ -61,7 +61,9 @@ if (res.maxLevel >= 51) {
 | 41       | warning     | Precursor to error (always paired with 51)|
 | 51       | error       | Call failed — result is `null`            |

-In practice, `maxLevel == 31` means success, `maxLevel >= 51` means failure. Warning-only (41 without 51) was not observed in testing.
+In practice, `maxLevel == 31` means success, `maxLevel >= 51` means failure. Warning-only (41 without 51) was not observed in testing — warnings always accompany errors as precursors (e.g., the ToId warning before an invalid ID error).
+
+**Caveat:** `result === null` is **NOT** a reliable failure indicator. VOID-returning APIs (`setObjectName`, `setAppearance`, `recalc`, etc.) return `null` on success. And `evaluateExpression` with `silent: true` returns `null` with `maxLevel: 31` on failure. Use `maxLevel` for failure detection, not result nullity.

 ## Messages

@@ -75,7 +77,7 @@ In practice, `maxLevel == 31` means success, `maxLevel >= 51` means failure. War
 }
 ```

-**Undocumented field:** `levelStr` is always present but not in the API docs.
+**Undocumented field:** `levelStr` is always present but not in the API docs. **It is also inconsistent:** most APIs use `"WARNING"` for level 41, but `evaluateExpression` uses `"WARN"`. Always compare the numeric `level` field, never `levelStr`.

 **Inconsistency:** The `api` field is sometimes omitted (e.g. on `evaluateExpression` errors and unknown command errors).

@@ -85,9 +87,11 @@ In practice, `maxLevel == 31` means success, `maxLevel >= 51` means failure. War
 |------|----------------------------------|----------------------------------------------|
 | 0    | General/unclassified             | Internal errors, warnings about ID conversion|
 | 1001 | Wrong parameter type             | String where boolean expected                |
+| 1003 | Empty parameter object           | Passing `param: {}` where non-empty expected |
 | 1004 | Missing required parameter       | Omitting `expression` from evaluateExpression|
 | 1006 | Invalid ID                       | Nonexistent ID, string as ID                 |
 | 1007 | Wrong ID type                    | Part ID where feature/operation ID expected  |
+| 1013 | Invalid parameter value          | Invalid enum value — message lists valid options |
 | 1200 | Root already exists              | Second `part.create` in same drawing         |
 | 1201 | Unknown command                  | `v1.common.doesNotExist`, `sketch.isSolved`  |

@@ -146,6 +150,8 @@ Extra/unknown parameters are silently ignored — no warning.

 **Booleans:** `TRUE` → `1`, `FALSE` → `0` (uppercase only). Comparison operators (`==`, `>`, `<`) do NOT work.

+**`silent` mode:** `evaluateExpression({ expression, silent: true })` suppresses ALL messages on failure — `messages: []`, `maxLevel: 31`, `result: null`. The expression still fails but the failure is invisible. There is no way to distinguish a silent failure from a VOID success. Avoid `silent: true` unless you intentionally want to suppress errors.
+
 ## Drawing Constraints
```

## Summary of changes

1. **levelStr inconsistency documented:** "WARNING" vs "WARN" for level 41 across APIs — advise using numeric `level` only
2. **New error codes:** 1003 (empty parameter object) and 1013 (invalid parameter value with helpful enum listing)
3. **Failure detection caveat:** `result === null` is unreliable — VOID APIs return null on success, silent mode masks failures
4. **`silent` mode documented:** `evaluateExpression` silent param suppresses all messages and keeps maxLevel=31 even on failure
5. **Warning-error relationship clarified:** Warnings (41) always accompany errors (51) as precursors, never standalone
