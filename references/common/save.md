# common.save

Serializes the current drawing to a data string or file in the specified format. By default returns the model as an OFB data string.

## Prerequisites

- At least `part.create` must have been called. Saving an empty drawing fails with `"No root product could be found."` and `"There is nothing to be stored."` (maxLevel=51, success=0).

## Key Parameters

- `format` — `'OFB'` (default), `'STP'`, `'STL'`, `'SCG'`, `'IWP'`. DXF is documented but **broken in classcad-cli** (missing template file).
- `encoding` — `'base64'`. Always use this for data-string saves. Without it, binary formats (STL, compressed OFB) produce corrupted content in JSON strings.
- `compression` — `'deflate'`. **Never use without `encoding: 'base64'`** — raw deflated binary data is garbled in JSON string transport.
- `file` — write to a local file path instead of returning content. When set, `content` is absent from the result.
- `url` — POST the data to a URL instead of returning content.

## Result Structure

```js
{
  result: {
    success: 1,     // numeric 1/0, NOT boolean true/false
    content: '...'  // string — only present when no file/url is set
  },
  messages: [...],
  maxLevel: 31      // 31=info (normal), 51=error
}
```

**Check `success`, not `maxLevel`.** Some operations (e.g., `stp.analytic: 1`) set maxLevel=51 but still produce valid content with success=1.

## The Practical Pipeline

For data transport (save → transmit → load), always use:

```js
const saved = await api.v1.common.save({
  format: 'OFB',
  encoding: 'base64',
  compression: 'deflate'
})
// saved.result.content is a compact base64 string (~87% smaller than raw OFB)
```

Order of operations on save: data → deflate → base64. On load: base64-decode → inflate → data.

## Format Comparison

Measured on the same box geometry (80x60x40), all base64 encoded:

| Format | Size (b64 chars) | Preserves Parametrics | Notes |
|---|---|---|---|
| OFB (deflate+b64) | ~5,700 | Yes | Best for roundtrip — smallest full-fidelity option |
| OFB (raw b64) | ~44,000 | Yes | No compression |
| STP (b64) | ~13,000 | No | Standard CAD interchange format |
| SCG (b64) | ~19,000 | Yes | ClassCAD scene graph |
| IWP Binary (b64) | ~22,000 | No | SMLib internal format |
| IWP ASCII (b64) | ~49,000 | No | SMLib internal, verbose |
| STL (b64) | ~900 | No | Mesh only — tiny for flat surfaces, huge for curved |

## Format Details

### OFB (ClassCAD native)

- Preserves full parametric model: expressions, features, assembly structure
- Raw text format with `classcad\nVersion=11\n...` header
- `ofb.version` — no observable effect in current CLI (all produce Version=11)
- `ofb.geometry` (0-4) — no observable effect in CLI mode (no graphics context). All levels produce identical output.

### STP (STEP)

- `stp.version`: 1=AP203, 2=AP214 (default), 3=AP242. Minor size differences.
- `stp.asPart`: set to `1` (TRUE) to flatten assembly structure into a single part. Slightly smaller output.
- `stp.analytic`: set to `1` to convert B-spline geometry to analytic forms. Produces smaller files but triggers error-level messages (maxLevel=51) even on success.
- `stp.header.filename.name` / `stp.header.filename.organization` — **no effect on data-string output**. Header always uses the part name. May only work with file-based saves.
- IDs change on STP roundtrip — don't hardcode IDs from before the save.

### STL

- **Must use `encoding: 'base64'`** for data-string saves. Without it, binary content is truncated to the 32-char header in JSON transport.
- `stl.binary` — default TRUE. Setting to `0` (FALSE) did not produce observable ASCII output in data-string mode.
- `stl.facetingTol` / `stl.angleTol` — only affect curved surfaces. Flat-faced geometry (boxes) is unaffected. Tighter tolerances → more triangles → larger files (significant for spheres/cylinders).
- Size varies dramatically with geometry: a box is ~900 b64 chars, a sphere is ~240,000.

### DXF

- **Broken in classcad-cli.** Error: `CADH_GetDxfTemplateFile not found`. Do not attempt.

### SCG / IWP

- SCG: ClassCAD scene graph format. Preserves assembly structure. Mid-size.
- IWP: SMLib internal format. `iwp.binary: 1` halves the content size vs ASCII default.

## Gotchas

- `success` is numeric `1`/`0`, not JS boolean. Use `saved.result.success === 1` or just truthiness check.
- A bare part (no geometry) saves successfully in OFB/STP. STL succeeds but returns empty content (length 0).
- Deflate-only (no base64) produces binary data that corrupts in JSON. The JS string `.length` is meaningless on such content.
- OFB is ~4-5x larger than STP for the same geometry because it includes parametric history.
- OFB roundtrip preserves the root part ID. STP roundtrip changes all IDs. Always use the `id` from the load result.

## Working Example

```js
// Save and reload a model
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

// Save with practical pipeline
const saved = await api.v1.common.save({
  format: 'OFB',
  encoding: 'base64',
  compression: 'deflate'
})
const data = saved.result.content // compact base64 string

// Later: reload
await api.v1.common.clear({})
const loaded = await api.v1.common.load({
  data,
  format: 'OFB',
  encoding: 'base64',
  compression: 'deflate'
})
const newPartId = loaded.result.id // use this ID going forward
```

## Related

- `common.load` — load from data string or file
- `common.clear` — clear the drawing before loading
- `common.recalc` — recalculate after loading
