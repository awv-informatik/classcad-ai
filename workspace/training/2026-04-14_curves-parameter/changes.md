# Changes: curves parameter study

## New file: `references/solid/curves-parameter.md`

New LLM doc covering the `curves` parameter shared by `solid.extrusion` and `solid.revolve`. Key findings:

- Two accepted ID types: `"shape"` and `"sketch-curve"` (confirmed via error messages)
- sketchRegion IDs are NOT accepted (different type)
- Parameter is flexible: scalar or array form for both types
- Cross-source mixing works: shape IDs + sketch-curve IDs in the same array
- Cross-sketch mixing works: elements from different sketches
- Closed loop enforced by kernel, not param validator (different error messages)
- `sketch.circle` returns usable ID; `curve.circle` returns VOID

## Updated: `references/solid/extrusion.md`

- Updated `curves` description to reference new `curves-parameter.md` and note mixing/sketchRegion rejection
- Added `curves-parameter.md` to Related section

## Updated: `references/solid/revolve.md`

- Same updates as extrusion.md

## Diff

```diff
diff --git a/references/solid/curves-parameter.md b/references/solid/curves-parameter.md
new file mode 100644
+# The `curves` Parameter (solid.extrusion & solid.revolve)
+...120 lines of new LLM doc...

diff --git a/references/solid/extrusion.md b/references/solid/extrusion.md
-- `curves` — the profile to extrude. Accepts TWO forms:
-  - **Shape ID** (single value) — from `curve.shape`. The shape must contain closed curves.
-  - **Array of sketch element IDs** — from sketch drawing APIs
+- `curves` — the profile to extrude. Accepts IDs of type `"shape"` or `"sketch-curve"`. See `curves-parameter.md` for full details. Short version:
+  - **Shape ID** (scalar or in array) — from `curve.shape`. The shape must contain closed curves.
+  - **Array of sketch-curve IDs** — from `sketch.rectangle`, `sketch.line`, `sketch.circle`, etc.
+  - **Mixed** — shape IDs and sketch-curve IDs can be combined in one array.
+  - **NOT accepted:** sketchRegion IDs (different type).
+- `curves-parameter.md` — full reference on the `curves` parameter (accepted types, mixing, edge cases)

diff --git a/references/solid/revolve.md b/references/solid/revolve.md
(same pattern of changes as extrusion.md)
```
