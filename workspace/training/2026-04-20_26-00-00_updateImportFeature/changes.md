# Changes — updateImportFeature training

## New file: `references/part/updateImportFeature.md`

```diff
+# part.updateImportFeature
+
+Updates an existing import feature with new model data, replacing the imported geometry entirely.
+
+## Prerequisites
+
+- An import feature (`part.importFeature`)
+- The feature must be opened with `openFeature` before updating and closed with `closeFeature` after
+
+## Key Parameters
+
+- `id` — **import feature ID** (from `importFeature`, NOT the part ID)
+- `data` — new inline model data string. Replaces all existing imported geometry.
+- `file` — local file path to import from
+- `url` — URL to fetch model from
+- `format` — `"STP"` (match the data format)
+- `encoding` — `"base64"` if data is base64-encoded
+- `compression` — `"deflate"` if data is deflate-compressed
+- `name` — rename the import feature (optional, existing name preserved if omitted)
+
+**A data source (`data`, `file`, or `url`) is always required.** The docs say optional params keep existing values, but omitting all data sources errors with code 1004. You cannot rename without also providing data.
+
+## Return Value
+
+Feature ID (same as input `id`) on success, maxLevel=31. Returns `null` with maxLevel=51 on error.
+
+## How It Works
+
+1. `openFeature(importId)` — activates the feature for editing
+2. `updateImportFeature({ id, data, format, ... })` — replaces geometry
+3. `closeFeature(importId)` — commits the change
+4. `recalc()` — regenerates the model
+
+The update completely replaces all child solids under the CC_Import entity. If the old import had 2 bodies and the new STP has 1, you end up with 1 solid (and vice versa).
+
+## Gotchas
+
+- **Requires `openFeature`/`closeFeature`.** Without `openFeature`, you get code 1200.
+- **Data source is mandatory despite docs.** Cannot do name-only rename.
+- **Name-only update is a partial-success bug.** Returns error but name change IS applied.
+- **Garbage data silently destroys geometry.** Returns success but replaces geometry with nothing.
+- **Body count adjusts dynamically.** Old child solids removed, new ones created.
+- **Name is preserved when omitted.** Data-only update keeps existing name.
+
+## Common Errors
+
+| Code | Message | Cause |
+|---|---|---|
+| 1200 | "not allowed to update. It's not active and open." | Forgot `openFeature` |
+| 1004 | "Either data, file or url must be provided" | No data source |
+| 1007 | "not a feature or work geometry id." | Wrong ID type |
+| 1008 | "The provided file does not exist." | Bad file path |
+
+## Working Example + Related APIs included.
```
