# part.updateImportFeature

Updates an existing import feature with new model data, replacing the imported geometry entirely.

## Prerequisites

- An import feature (`part.importFeature`)
- The feature must be opened with `openFeature` before updating and closed with `closeFeature` after

## Key Parameters

- `id` — **import feature ID** (from `importFeature`, NOT the part ID)
- `data` — new inline model data string. Replaces all existing imported geometry.
- `file` — local file path to import from
- `url` — URL to fetch model from
- `format` — `"STP"` (match the data format)
- `encoding` — `"base64"` if data is base64-encoded
- `compression` — `"deflate"` if data is deflate-compressed
- `name` — rename the import feature (optional, existing name preserved if omitted)

**A data source (`data`, `file`, or `url`) is always required.** The docs say optional params keep existing values, but omitting all data sources errors with code 1004. You cannot rename without also providing data.

## Return Value

Feature ID (same as input `id`) on success, maxLevel=31. Returns `null` with maxLevel=51 on error.

## How It Works

1. `openFeature(importId)` — activates the feature for editing
2. `updateImportFeature({ id, data, format, ... })` — replaces geometry
3. `closeFeature(importId)` — commits the change
4. `recalc()` — regenerates the model

The update completely replaces all child solids under the CC_Import entity. If the old import had 2 bodies and the new STP has 1, you end up with 1 solid (and vice versa).

## Gotchas

- **Requires `openFeature`/`closeFeature`.** Without `openFeature`, you get code 1200: "The provided feature is not allowed to update. It's not active and open."
- **Data source is mandatory despite docs.** Cannot do name-only rename — always requires `data`, `file`, or `url`.
- **Name-only update is a partial-success bug.** Calling with only `name` (no data) returns error (maxLevel=51) but the name change IS applied. The geometry survives unchanged, but the error is misleading.
- **Garbage data silently destroys geometry.** Passing invalid STP data returns success (maxLevel=31, valid feature ID) but replaces existing geometry with nothing — 0 child solids. This is destructive and irreversible. Always validate data before updating.
- **Body count adjusts dynamically.** Updating from a 2-body STP to a 1-body STP removes the extra child solid. Updating from 1 to 3 adds child solids.
- **Name is preserved when omitted.** If you pass data without `name`, the existing name stays.

## Common Errors

| Code | Message | Cause |
|---|---|---|
| 1200 | "The provided feature is not allowed to update. It's not active and open." | Forgot `openFeature` |
| 1004 | "Either data, file or url must be provided to load content from." | No data source provided |
| 1007 | "The provided id for the feature is not a feature or work geometry id." | Passed part ID instead of import feature ID |
| 1008 | "The provided file does not exist." | Invalid file path |

## Working Example

```js
// Create source geometry and save as STP
const srcPart = (await api.v1.part.create({ name: 'Source' })).result
await api.v1.part.cylinder({ id: srcPart, radius: 25, height: 50 })
const stpData = (await api.v1.common.save({
  format: 'STP', compression: 'deflate', encoding: 'base64',
})).result.content
await api.v1.common.clear({})

// Create target with initial import
const tgtPart = (await api.v1.part.create({ name: 'Target' })).result
const importId = (await api.v1.part.importFeature({
  id: tgtPart, data: oldStp, format: 'STP', name: 'MyImport',
})).result

// Update the import with new geometry
await api.v1.part.openFeature({ id: importId })
await api.v1.part.updateImportFeature({
  id: importId,
  data: stpData,
  format: 'STP',
  compression: 'deflate',
  encoding: 'base64',
})
await api.v1.part.closeFeature({ id: importId })
await api.v1.common.recalc({})
```

## Related

- `part.importFeature` — create the import feature this updates
- `part.openFeature` / `part.closeFeature` — required wrapping for all update operations
