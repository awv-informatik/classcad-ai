# common.load

Loads a model from a data string, file path, or URL into the drawing. The drawing must be empty or `doClear` must be set. Returns the root product ID.

## Prerequisites

- Drawing must be cleared first (`common.clear({})`), OR pass `doClear: 1` to auto-clear before loading.
- Without clearing: error `"There is already a model which must be removed first."` (maxLevel=51).

## Key Parameters

- **Source** (pick one):
  - `data` — content string (from a prior `common.save` data-string output)
  - `file` — absolute path on the ClassCAD server's filesystem
  - `url` — URL to fetch the file from
  - If none provided: error code 1004, `"Either data, file or url must be provided."`
- `format` — `'OFB'`, `'STP'`, or `'IWP'` only. **SCG, STL, DXF cannot be loaded** (code 1013). Auto-detected from file extension (`.ofb`, `.stp`) or data content for OFB. Best practice: specify explicitly.
- `doClear` — set to `1` (TRUE) to auto-clear the drawing before loading. Preferred over a separate `clear()` call.
- `encoding` — `'base64'`. Must match the encoding used on save.
- `compression` — `'deflate'`. Must match the compression used on save.
- `stp.asPart` — set to `1` (TRUE) to flatten assembly structure into a single part. Works but generates an error-level message (`"CreateNamedPoint not found"`, maxLevel=51). Geometry loads fine despite the error.
- `ofb.geometry` — 2 (geometry), 3 (graphics), 4 (both). No observable effect in CLI mode. Default (2) is fine.
- `ident` — documented as "custom string identifier for the loaded root product". No observable effect in testing (OFB). May only apply to non-OFB imports.

## Result Structure

```js
{
  result: { id: 4 },    // root product ID of the loaded model
  messages: [],          // empty on success
  maxLevel: 31           // 31=info (success), 51=error
}
```

- `result.id` — the root product ID. **Always use this ID going forward**, not any pre-save IDs.
- On failure: `result: null`, maxLevel=51 with descriptive error messages.

## ID Preservation by Format

| Format | IDs Preserved? | Notes |
|---|---|---|
| OFB | Yes | All IDs preserved — part, entity injection, expressions. Can modify loaded model using original IDs. |
| STP | No | All IDs change. Must discover new IDs from the loaded structure. |
| IWP | No | All IDs change, like STP. |

## Supported Load Formats

Only **3 formats** can be loaded, even though `common.save` supports 6:

| Format | Loadable? | Notes |
|---|---|---|
| OFB | Yes | Full fidelity — preserves IDs, expressions, feature history, booleans |
| STP | Yes | Standard interchange. IDs change. `stp.asPart` available. |
| IWP | Yes | SMLib internal. IDs change. |
| SCG | **No** | Save-only. Load rejects with code 1013. |
| STL | **No** | Save-only (mesh format). |
| DXF | **No** | Broken in classcad-cli. |

## What OFB Roundtrip Preserves

- Root part ID (same numeric ID)
- Entity injection feature IDs
- Named expressions (names, values, formulas)
- Boolean operation history
- Feature tree structure
- All child IDs within the model

This means after an OFB load, you can immediately use previously-known IDs to add geometry, modify features, or query expressions.

## Gotchas

- **Clear first.** Loading into a non-empty drawing is a hard error. Use `doClear: 1` as the simplest path.
- **No recalc needed.** Geometry is renderable immediately after load. `recalc()` is not required for basic use.
- **Encoding must match.** If saved with `encoding: 'base64', compression: 'deflate'`, load with the same params.
- **Raw OFB works.** OFB is text-based, so data-string transport without encoding/compression works (unlike STL). But deflate+base64 is ~6x smaller.
- **STP ID shift.** Never hardcode IDs across an STP save/load boundary. Always use `result.id` from load.
- **SCG is export-only.** Despite being saveable, SCG cannot be loaded back. This is not documented in the API — the only way to discover it is the validation error.
- **Mismatched format.** Loading data with the wrong format produces a generic error (`"No product could be loaded"`) rather than a specific "wrong format" message.
- **`stp.asPart` warning.** On load, `stp.asPart: 1` returns maxLevel=51 with a "CreateNamedPoint" error. The geometry is fine — check `result.id` existence, not just maxLevel.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"There is already a model which must be removed first."` | Drawing not cleared | Call `clear({})` first or use `doClear: 1` |
| `"Either data, file or url must be provided..."` (code 1004) | No source specified | Provide `data`, `file`, or `url` |
| `"Import has to contain a CC_Product."` + `"Nothing could be loaded!"` | Corrupt/empty data | Verify the data string from save |
| `"The provided value for parameter \"format\" is not valid."` (code 1013) | Unsupported format (SCG/STL/DXF) | Use OFB, STP, or IWP |
| `"No product could be loaded, expected a CC_Product"` | Format mismatch (e.g., OFB data with STP format) | Match format to actual data |
| `"CreateNamedPoint not found"` (maxLevel=51) | `stp.asPart: 1` | Harmless — geometry loads fine |

## Working Example

```js
// The practical OFB roundtrip
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

// Save
const saved = await api.v1.common.save({
  format: 'OFB',
  encoding: 'base64',
  compression: 'deflate',
})
const data = saved.result.content

// Load (with auto-clear)
const loaded = await api.v1.common.load({
  data,
  format: 'OFB',
  encoding: 'base64',
  compression: 'deflate',
  doClear: 1, // auto-clears — no need for separate clear()
})

// Use loaded.result.id as root part ID
// For OFB: original IDs still work (partId, eifId)
// For STP/IWP: use loaded.result.id, re-discover other IDs
```

## File-Based Loading

```js
// Load from disk — format auto-detected from extension
await api.v1.common.load({ file: '/path/to/model.ofb' })
await api.v1.common.load({ file: '/path/to/model.stp' })

// Or specify format explicitly
await api.v1.common.load({ file: '/path/to/model.stp', format: 'STP' })
```

## Related

- `common.save` — save the model to data string or file
- `common.clear` — clear the drawing (required before load, unless using `doClear`)
- `common.recalc` — recalculate the drawing (not needed after basic load)
