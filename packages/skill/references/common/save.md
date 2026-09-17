# common.save

Serializes the drawing to a data string (default) or file. Default format OFB.

## Prerequisites

At least `part.create`. An empty drawing fails with `"No root product could be found."` and `"There is nothing to be stored."` (maxLevel 51, success 0).

## Key Parameters

- `format` — `'OFB'` (default), `'STP'`, `'STL'`, `'SCG'`, `'IWP'`. DXF is documented but **broken in classcad-cli**: `CADH_GetDxfTemplateFile not found` (missing template file). Don't attempt.
- `encoding` — `'base64'`. Always use for data-string saves; without it binary formats (STL, compressed OFB) are corrupted in JSON strings.
- `compression` — `'deflate'`. **Never without `encoding: 'base64'`** (garbled in transport; the JS string `.length` is meaningless).
- `file` — write to a local path; `content` is then absent from the result.
- `url` — POST the data to a URL instead of returning it.

Pipeline details: `encoding-pipeline.md`.

## Result Structure

```js
{ result: { success: 1 /* numeric 1/0 */, content: '...' /* only without file/url */ }, messages: [...], maxLevel: 31 }
```

**Check `success`, not `maxLevel`.** Some options (e.g. `stp.analytic: 1`) set maxLevel 51 but still produce valid content with success 1.

## Format Sizes

Same 80×60×40 box, base64:

| Format | b64 chars | Parametrics | Notes |
|---|---|---|---|
| OFB (deflate+b64) | ~5,700 | Yes | Best round trip — smallest full-fidelity (~87% smaller than base64-only OFB) |
| OFB (raw b64) | ~44,000 | Yes | |
| STP | ~13,000 | No | Standard CAD interchange |
| SCG | ~19,500 | Yes | ClassCAD scene graph |
| IWP binary | ~22,000 | No | SMLib internal |
| IWP ASCII | ~49,000 | No | SMLib internal, verbose |
| STL | ~900 | No | Mesh only — tiny for flat, huge for curved |

OFB is ~4-5× larger than STP (parametric history).

## Format Options

**OFB** — full parametric model (expressions, features, assembly structure); raw text starts `classcad\nVersion=11\n...`. `ofb.version` and `ofb.geometry` (0-4) have no observable effect in CLI (all Version=11, identical output).

**STP**
- `stp.version`: 1=AP203, 2=AP214 (default), 3=AP242. Minor size differences.
- `stp.asPart: 1` flattens assembly into one part; slightly smaller.
- `stp.analytic: 1` converts B-splines to analytic forms; smaller, but error-level messages (maxLevel 51) even on success.
- `stp.header.filename.name` / `.organization` — no effect on data-string output (header always uses the part name); may only work with file saves.

**STL**
- **Must use `encoding: 'base64'`** — otherwise truncated to the 32-char header.
- `stl.binary` — default TRUE; `false`/`0` writes ASCII (content starts with `solid`).
- `stl.facetingTol` / `stl.angleTol` — affect curved surfaces only (boxes unaffected); tighter → more triangles. Box ~900 b64 chars, sphere ~240,000.

**SCG** — ClassCAD scene graph; preserves assembly structure; mid-size.
**IWP** — SMLib internal; `iwp.binary: 1` halves content vs ASCII default.

## Gotchas

- `success` is numeric: `saved.result.success === 1` or truthiness.
- A bare part (no geometry) saves in OFB/STP; STL succeeds with empty content (length 0).
- OFB round trip preserves the root part ID; STP changes all IDs — use `id` from the load result.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

const saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
const data = saved.result.content

// Reload — params must match the save
const loaded = await api.v1.common.load({ data, format: 'OFB', encoding: 'base64', compression: 'deflate', doClear: 1 })
const newPartId = loaded.result.id
```

## Related

`common.load` · `common.clear` · `common.recalc` · `format-comparison.md` · `encoding-pipeline.md`
