# Changes — part.updateBox training

## New file: `references/part/updateBox.md`

Created dedicated LLM doc for `part.updateBox` covering:
- Open/close pattern requirement
- All parameters (id, name, length/width/height, references)
- Return value behavior (feature ID on success, null without openFeature)
- Partial update, multi-param, sequential updates, noop, expressions
- Gotchas: wrong feature type (silent success), name vs body name, misleading error 1004
- Common errors table
- Working example with dimension update, WCS move, and expression binding

## Updated: `references/part/box.md`

Updated the `## updateBox` section:
- Added return value clarification (feature ID, not VOID)
- Added note about multiple sequential updates
- Changed "expression strings" to specific `@expr.NAME` and inline math
- Updated error code from just 1200 to 1200 + 1004
- Added cross-reference to new `updateBox.md`

## Updated: `references/part/openFeature.md`

Corrected wrong-type behavior claims based on testing:
- **Old:** "Calling `updateCylinder` on a box ID produces a cryptic internal error ('Index ausserhalb des Arraybereichs')"
- **New:** Mismatched update methods may NOT error — shared params silently apply
- Updated gotchas and common errors table to reflect this

## Diff

```diff
diff --git a/references/part/box.md b/references/part/box.md
--- a/references/part/box.md
+++ b/references/part/box.md
-Updates an existing box feature's dimensions, name, or references.
+Updates an existing box feature's dimensions, name, or references. See `references/part/updateBox.md` for full details.
+- Returns feature ID on success, null on failure (not VOID)
+- Multiple updateBox calls within a single open/close all apply
+- Supports `@expr.NAME` references and inline math in dimension params
-- Without `openFeature`: returns null with error code 1200
+- Without `openFeature`: returns null with errors 1200 + 1004

diff --git a/references/part/openFeature.md b/references/part/openFeature.md
--- a/references/part/openFeature.md
+++ b/references/part/openFeature.md
-- **Match update type to feature type.** Calling `updateCylinder` on a box ID produces a cryptic internal error
+- **Match update type to feature type.** Calling a mismatched update method may NOT error — shared param names silently apply
-- Wrong `update*` type on a feature gives an unhelpful German error about array index bounds
+- Wrong `update*` type on a feature does NOT always error — shared params silently apply
-| "Index ausserhalb des Arraybereichs" | Wrong `update*` method for feature type |
+| (no error — silent success) | Wrong `update*` method for feature type |

diff --git a/references/part/updateBox.md b/references/part/updateBox.md
new file mode 100644
+# part.updateBox (89 lines — full LLM doc)
```
