# Changes: operationMoveToEnd

## File: `references/part/operationMoveBefore.md`

```diff
-- At least one feature in the design tree
+- At least one feature in the design tree (moveToEnd also works on an empty part — silent no-op)

-- **Forward moves** (toward end) trigger recalculation of the features being restored.
+- **Forward moves** (toward end) trigger recalculation of the features being restored. Changes made via `openFeature`/`updateBox`/`closeFeature` at mid-tree propagate through downstream features (booleans, patterns) on moveToEnd.
+- **open/close without changes** + moveToEnd is fine — no unnecessary recalc, silent success.

+## Error Handling
+
+### operationMoveBefore errors
+
+| Input | Code | Error |
+|---|---|---|
+| `featureId: partId` (wrong type) | 1001 | `"has a wrong id type! ..."` |
+| `featureId: 999999` (nonexistent) | 1006 | `"has an invalid id!"` |
+
+### operationMoveToEnd errors
+
+| Input | Code | Error |
+|---|---|---|
+| `id: featureId` (wrong type) | 1001 | `"has a wrong id type! ..."` |
+| `id: 999999` (nonexistent) | 1006 | `"has an invalid id!"` |
+| `id: 0` | 1006 | `"has an invalid id!"` |
+| `{}` (missing id) | 1004 | `"must be provided in the api call!"` |

-- `featureId` must be a feature/workgeometry/sketch ID, NOT a part ID. Error: ...
-- Invalid IDs (nonexistent) give error 1006: ...
+- **moveBefore:** `featureId` must be a feature/workgeometry/sketch ID, NOT a part ID.
+- **moveToEnd:** `id` must be a part ID, NOT a feature ID.
```
