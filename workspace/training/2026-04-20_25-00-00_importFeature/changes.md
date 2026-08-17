# Changes — importFeature training

## New files

- `references/part/importFeature.md` — LLM doc for `part.importFeature`

## Diff

```diff
diff --git a/references/part/importFeature.md b/references/part/importFeature.md
new file mode 100644
+# part.importFeature
+
+Creates an import feature that brings external model data (STEP format) into a part as solid geometry. Each import creates a `CC_Import` entity in the EntitySet, with child `CC_Solid` nodes for each body in the imported data.
+
+## Prerequisites
+
+- A part (`part.create`)
+
+## Key Parameters
+
+- `id` — **part ID** to import into
+- `data` — inline model data string (from `common.save`). Mutually exclusive with `file` and `url`.
+- `file` — local file path accessible by the ClassCAD process. Format auto-detected from extension.
+- `url` — URL to fetch model from
+- `format` — `"STP"` (default). Optional when using `file` (auto-detected from extension) or `data` (defaults to STP).
+- `encoding` — `"base64"` if data is base64-encoded. Decoding happens before decompression.
+- `compression` — `"deflate"` if data is deflate-compressed. Decompression happens after decoding.
+- `name` — feature name (default `"Import"`)
+
+**At least one data source required:** `data`, `file`, or `url`. Omitting all three gives error 1004.
+
+## Return Value
+
+Feature ID (numeric) on success, maxLevel=31. Returns `null` with maxLevel=51 on error.
+
+## Gotchas
+
+- **Invalid data is a silent success.** Creates feature with no geometry, no error.
+- **Invalid format strings also silently succeed.** Same empty import.
+- **Boolean unions export as single bodies.** Union → one solid in STP.
+- **All imported bodies land at origin.** Absolute coordinates from source model.
+
+## Common Errors
+
+| Code | Message | Cause |
+|---|---|---|
+| 1004 | "Either data, file or url must be provided" | No data source |
+| 1008 | "The provided file does not exist." | File path not found |
```
