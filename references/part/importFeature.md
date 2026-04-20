# part.importFeature

Creates an import feature that brings external model data (STEP format) into a part as solid geometry. Each import creates a `CC_Import` entity in the EntitySet, with child `CC_Solid` nodes for each body in the imported data.

## Prerequisites

- A part (`part.create`)

## Key Parameters

- `id` — **part ID** to import into
- `data` — inline model data string (from `common.save`). Mutually exclusive with `file` and `url`.
- `file` — local file path accessible by the ClassCAD process. Format auto-detected from extension.
- `url` — URL to fetch model from
- `format` — `"STP"` (default). Optional when using `file` (auto-detected from extension) or `data` (defaults to STP).
- `encoding` — `"base64"` if data is base64-encoded. Decoding happens before decompression.
- `compression` — `"deflate"` if data is deflate-compressed. Decompression happens after decoding.
- `name` — feature name (default `"Import"`)

**At least one data source required:** `data`, `file`, or `url`. Omitting all three gives error 1004.

## Return Value

Feature ID (numeric) on success, maxLevel=31. Returns `null` with maxLevel=51 on error.

## How It Works

1. Data is decoded (base64 → raw) then decompressed (deflate → plaintext) if encoding/compression are set
2. STP content is parsed and geometry is added to the part
3. A `CC_Import` entity is created in the EntitySet with child `CC_Solid` nodes named `<importName>_0`, `<importName>_1`, etc.
4. Each body in the STP becomes one child solid

**Non-destructive:** Import adds to existing geometry. Existing features and solids are preserved.

**Multiple imports:** You can call `importFeature` multiple times on the same part. Each creates a separate `CC_Import` entity.

## Data Transfer Tips

Use deflate compression for inline data — it gives ~97% size reduction on STP strings:
- Raw STP: ~9600 chars
- Deflate only: ~286 chars (smallest, but binary)
- Base64 + deflate: ~2972 chars (safe for JSON transport)
- Base64 only: ~12796 chars (larger than raw)

Save with matching options: `common.save({ format: 'STP', compression: 'deflate', encoding: 'base64' })`, then import with the same `compression` and `encoding` params.

## Gotchas

- **Invalid data is a silent success.** Passing garbage as `data` creates a `CC_Import` feature (maxLevel=31, valid ID returned) but with **no child solids and no geometry**. Always check `part.solids` in the structure after import to confirm geometry was actually created.
- **Invalid format strings also silently succeed.** Same behavior — empty import feature, no error.
- **Boolean unions export as single bodies.** A box + cylinder union saved as STP becomes one solid on import, not two.
- **All imported bodies land at origin.** The STP contains absolute coordinates — imported geometry appears at whatever position it had in the source model.

## Common Errors

| Code | Message | Cause |
|---|---|---|
| 1004 | "Either data, file or url must be provided to load content from." | No data source provided |
| 1008 | "The provided file does not exist." | File path not found |

## Working Example

```js
// Save a part as STP
const srcPart = (await api.v1.part.create({ name: 'Source' })).result
await api.v1.part.box({ id: srcPart, length: 50, width: 40, height: 30 })
const stpData = (await api.v1.common.save({
  format: 'STP', compression: 'deflate', encoding: 'base64',
})).result.content

// Import into another part
await api.v1.common.clear({})
const tgtPart = (await api.v1.part.create({ name: 'Target' })).result
const importId = (await api.v1.part.importFeature({
  id: tgtPart,
  data: stpData,
  format: 'STP',
  compression: 'deflate',
  encoding: 'base64',
  name: 'ImportedBox',
})).result
```

## Related

- `part.updateImportFeature` — modify after creation (change data source, name)
- `common.save` — export current model to STP/OFB/STL data or file
