# Changes — sketch.updateDimension training (2026-04-09)

## New file: `references/sketch/updateDimension.md`

Full LLM doc for `sketch.updateDimension` covering:
- All accepted value formats (numeric, expression, degree/unit strings, arbitrary strings)
- No server-side value validation
- No batch mode support
- Geometry does not move (solver doesn't run)
- Feature state independence
- Expression linking behavior (paramName → "@value" marker)
- Error codes and messages (1001, 1004, 1006)
- Working example

## Modified: `references/sketch/dimension.md`

Updated the `## updateDimension` section to point to the new dedicated doc and added key facts summary:

```diff
-Updates the stored value of a dimension. Accepts numeric or expression values.
-
-- **`id`** — the dimension ID (not sketch ID).
-- **`value`** — numeric (e.g. `50`) or expression string (e.g. `'@expr.myWidth'`).
-- Returns `result: boolean` — always 0 (false = sketch not solved). maxLevel=31 on success.
+See [updateDimension.md](./updateDimension.md) for full documentation. Key facts:
+
+- **`id`** — the dimension ID (not sketch ID). Must be type `"dimension"`.
+- **`value`** — numeric, expression (`'@expr.name'`), degree string (`'45deg'`), or unit string (`'50mm'`). No server-side validation — even nonsense strings are accepted.
+- Returns `result: 0` (number, sketch unsolved). maxLevel=31 on success.
+- Does NOT support batch/array mode.
+- Does NOT trigger the sketch solver — geometry stays in place.
+- Works regardless of feature open/close state.
```
