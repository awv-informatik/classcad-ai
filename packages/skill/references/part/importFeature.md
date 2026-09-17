# part.importFeature

Imports external model data (STEP) into a part as solid geometry. Creates a `CC_Import` entity in the EntitySet with one child `CC_Solid` per body, named `<importName>_0`, `<importName>_1`, …

## Key Parameters

- `id` — **part ID**
- `data` — inline model data string (e.g. from `common.save`)
- `file` — local path reachable by the ClassCAD process; format auto-detected from extension
- `url` — URL to fetch from
- `format` — `"STP"` (default); optional with `file` (extension) or `data` (defaults to STP)
- `encoding` — `"base64"`; decoding happens before decompression
- `compression` — `"deflate"`; decompression happens after decoding
- `name` — default `"Import"`

Exactly one source of `data` / `file` / `url` (mutually exclusive); none → error 1004.

## Return Value

Feature ID, maxLevel=31. On error `null`, maxLevel=51.

## Behavior

- **Non-destructive** — adds to existing geometry; existing features/solids preserved.
- **Multiple imports** into one part are fine; each creates its own `CC_Import`.

## Data Transfer Tips

Deflate gives ~97% size reduction on STP strings:
- Raw STP: ~9600 chars
- Deflate only: ~286 chars (smallest, but binary)
- Base64 + deflate: ~2972 chars (safe for JSON transport)
- Base64 only: ~12796 chars (larger than raw)

Save with `common.save({ format: 'STP', compression: 'deflate', encoding: 'base64' })` and import with the same `compression`/`encoding`.

## Gotchas

- **Invalid data is a silent success** — garbage `data` creates a `CC_Import` (maxLevel=31, valid ID) with **no child solids, no geometry**. Check `part.solids` in the structure after import.
- **Invalid format strings** also silently succeed with an empty import feature.
- **Boolean unions export as single bodies** — box + cylinder union saved as STP imports as one solid.
- **Geometry keeps source coordinates** — STP holds absolute coordinates; imported bodies appear where they were in the source model.

## Common Errors

| Code | Message | Cause |
|---|---|---|
| 1004 | "Either data, file or url must be provided to load content from." | No data source |
| 1008 | "The provided file does not exist." | File path not found |

## Working Example

```js
const srcPart = (await api.v1.part.create({ name: 'Source' })).result
await api.v1.part.box({ id: srcPart, length: 50, width: 40, height: 30 })
const stpData = (await api.v1.common.save({ format: 'STP', compression: 'deflate', encoding: 'base64' })).result.content

await api.v1.common.clear({})
const tgtPart = (await api.v1.part.create({ name: 'Target' })).result
const importId = (await api.v1.part.importFeature({
  id: tgtPart, data: stpData, format: 'STP', compression: 'deflate', encoding: 'base64', name: 'ImportedBox',
})).result
```

## Related

`part.updateImportFeature` · `common.save`
