# Skill Changes — sliceBySheet & updateSliceBySheet

## New Files

- `references/part/sliceBySheet.md` — LLM doc for `part.sliceBySheet`
- `references/part/updateSliceBySheet.md` — LLM doc for `part.updateSliceBySheet`

## Diff

```diff
diff --git a/references/part/sliceBySheet.md b/references/part/sliceBySheet.md
new file mode 100644
--- /dev/null
+++ b/references/part/sliceBySheet.md
+# part.sliceBySheet
+
+Cuts a solid using a sheet body (surface) instead of a work plane. More flexible than `part.slice` — supports curved and arbitrary cutting surfaces. Consumes both target and tool.
+
+## Prerequisites
+- A part (`part.create`)
+- A solid feature as the target
+- A **sheet** feature as the tool (`part.extrusion` with `capEnds: 0`)
+
+## Key Parameters
+- `id` — part ID
+- `target` — feature ID (plain or object `{ id, indices }`)
+- `tool` — sheet feature ID (plain or object `{ id, indices }`)
+- `inverted` — integer 0 or 1 (NOT bool/string)
+- `name` — optional, defaults to "SliceBySheet"
+
+## Critical Gotchas
+- Sketch plane for sheet creation matters: Front/Right → solid result ✓, Top → sheet result ✗
+- inverted must be integer 0/1, not true/false/'TRUE'
+- Tool must be a sheet, not a solid
+- Both target and tool are consumed
+- No-intersection = silent no-op

diff --git a/references/part/updateSliceBySheet.md b/references/part/updateSliceBySheet.md
new file mode 100644
--- /dev/null
+++ b/references/part/updateSliceBySheet.md
+# part.updateSliceBySheet
+
+Updates an existing sliceBySheet feature.
+
+## Key Points
+- Requires `openFeature`/`closeFeature`
+- `id` = slice feature ID (not part ID)
+- Can update: tool, inverted, name, target
+- tool param requires object form `{ id: sheetId }`
```
