# Skill Changes — part.twist & part.updateTwist

## New Files

- `references/part/twist.md` — LLM doc for `part.twist`
- `references/part/updateTwist.md` — LLM doc for `part.updateTwist`

## Diff

```diff
diff --git a/references/part/twist.md b/references/part/twist.md
new file mode 100644
--- /dev/null
+++ b/references/part/twist.md
@@ -0,0 +1,121 @@
+# part.twist
+
+Creates a parametric twist feature inside a part by sweeping a 2D sketch profile along a direction while progressively rotating it around the twist axis.
+
+## Key Parameters
+- `twistAngle` — total rotation in radians over full extrusion length (default: 0). No upper limit.
+- `twistCenter` — CUSTOM type only. Defines twist axis position. Offset from profile = orbital paths.
+- `capEnds` — integer (1/0), NOT string. 1=solid, 0=sheet.
+- Type system: UP/DOWN/SYMMETRIC/CUSTOM — same as extrusion.
+
+## Key Findings
+- twistAngle=0 = straight extrusion (identical to part.extrusion)
+- Negative twistAngle reverses twist direction
+- No upper limit on angle — 4π creates drill-bit shapes
+- twistCenter/direction silently ignored for non-CUSTOM types
+- Offset twistCenter creates orbital/curved bodies
+- capEnds must be integer (string fails with error 1001)
+- updateTwist requires openFeature/closeFeature (error 1200 without)

diff --git a/references/part/updateTwist.md b/references/part/updateTwist.md
new file mode 100644
--- /dev/null
+++ b/references/part/updateTwist.md
@@ -0,0 +1,34 @@
+# part.updateTwist
+
+Updates an existing twist feature. Requires openFeature/closeFeature.
+- Can modify twistAngle, limit2, type, capEnds, references
+- Only changed params need to be passed
```
