# Changes — part.cylinder & part.updateCylinder

## New files

- `references/part/cylinder.md` — LLM doc for `part.cylinder`
- `references/part/updateCylinder.md` — LLM doc for `part.updateCylinder`

## Diff

```diff
diff --git a/references/part/cylinder.md b/references/part/cylinder.md
new file mode 100644
--- /dev/null
+++ b/references/part/cylinder.md
@@ -0,0 +1,109 @@
+# part.cylinder
+
+Creates a parametric cylinder feature inside a part. Unlike `solid.cylinder` (which creates direct geometry in an entity injection), `part.cylinder` lives in the feature tree, supports `updateCylinder`, expression-driven dimensions, and work coordinate system placement via `references`.
+
+## Prerequisites
+
+- A part (`part.create`)
+
+## Key Parameters
+
+- `id` — **part ID** (not entity injection ID — that's `solid.cylinder`)
+- `name` — feature name in the design tree (default: "Cylinder")
+- `diameter` — cylinder diameter (default: 100). Must be > 0. Accept numbers or expression strings (`'@expr.D'`, `'4*20'`, `'sqrt(100)'`)
+- `height` — height in Z direction (default: 100). Must be > 0. Same expression support as diameter.
+- `references` — array of **workCSys IDs only**. Places the cylinder at the coordinate system's origin. Empty array or omitted = drawing origin.
+
+## Return Value
+
+Feature ID (numeric) on success, with maxLevel 31 (info).
+
+## Gotchas
+
+- `references` only accepts workcsys IDs — error 1001 for anything else
+- Zero/negative dims create degenerate features — error 1122, feature ID still returned
+- Multiple cylinders per part fine — distinct colors per body
+
+## Common Errors
+
+| Code | Message | Cause |
+|------|---------|-------|
+| 1122 | "Value for [param] must be greater than 0" | Zero or negative dimension |
+| 1001 | "wrong id type!" | Non-workCSys in references |

diff --git a/references/part/updateCylinder.md b/references/part/updateCylinder.md
new file mode 100644
--- /dev/null
+++ b/references/part/updateCylinder.md
@@ -0,0 +1,88 @@
+# part.updateCylinder
+
+Updates an existing cylinder feature's dimensions, name, or coordinate system placement. Requires the open/close pattern.
+
+## Key Parameters
+
+- `id` — feature ID from part.cylinder (not part ID)
+- `name`, `diameter`, `height`, `references` — all optional, partial update supported
+
+## Return Value
+
+- Success: feature ID, maxLevel 31
+- No openFeature: null, errors 1200 + 1004
+- Zero/negative dims: feature ID (not null!), error 1122, previous geometry preserved
+
+## Gotchas
+
+- Without openFeature: null + errors 1200 + 1004
+- Wrong feature type: error code 0 "Index 3 ausserhalb des Arraybereichs"
+- Multiple calls in one open/close all apply
+- Expressions switchable: numeric → @expr.NAME → numeric
```
