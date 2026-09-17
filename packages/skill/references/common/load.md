# common.load

Loads a model from a data string, file path, or URL. Returns the root product ID.

## Prerequisites

Empty drawing (`common.clear({})`) or `doClear: 1`. Otherwise: `"There is already a model which must be removed first."` (maxLevel 51).

## Key Parameters

- **Source** (one of): `data` (string from `common.save`), `file` (absolute path on the ClassCAD server's filesystem), `url`. None → code 1004 `"Either data, file or url must be provided."`
- `format` — `'OFB'`, `'STP'`, `'IWP'` only; SCG, STL, DXF → code 1013. Auto-detected from file extension (`.ofb`, `.stp`) or, for OFB, from data content; best to specify.
- `doClear` — `1` auto-clears first. Preferred over a separate `clear()`.
- `encoding` — `'base64'`; `compression` — `'deflate'`. **Must match the save.** Mismatch gives only a generic error (see `encoding-pipeline.md`).
- `stp.asPart` — `1` flattens assembly structure into one part (loads at maxLevel 31).
- `ofb.geometry` — 2 (geometry, default), 3 (graphics), 4 (both). No observable effect in CLI mode.
- `ident` — documented as "custom string identifier for the loaded root product"; no observable effect (OFB). May only apply to non-OFB imports.

## Result Structure

`{ result: { id: 4 }, messages: [], maxLevel: 31 }` — `result.id` is the root product ID; **use it going forward**. On failure: `result: null`, maxLevel 51 with messages.

## Formats

| Format | Loadable | IDs preserved | Notes |
|---|---|---|---|
| OFB | ✅ | ✅ | Full fidelity: root part ID, entity injection IDs, all child IDs, named expressions (names, values, formulas), boolean history, feature tree. Previously-known IDs work immediately. |
| STP | ✅ | ❌ | Standard interchange; all IDs change — never hardcode IDs across an STP boundary; rediscover from the structure. |
| IWP | ✅ | ❌ | SMLib internal; IDs change. |
| SCG | ❌ | | Save-only; code 1013 (undocumented — only the validation error reveals it). |
| STL | ❌ | | Save-only mesh format. |
| DXF | ❌ | | Broken in classcad-cli. |

## Gotchas

- **No recalc needed** — geometry is renderable immediately after load.
- **Raw OFB works** (text-based) without encoding/compression, unlike STL — but deflate+base64 is ~6× smaller.
- **Wrong format** gives a generic `"No product could be loaded"`, not a "wrong format" message.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"There is already a model which must be removed first."` | Drawing not cleared | `clear({})` or `doClear: 1` |
| `"Either data, file or url must be provided..."` (1004) | No source | Provide `data`, `file`, or `url` |
| `"Import has to contain a CC_Product."` + `"Nothing could be loaded!"` | Corrupt/empty data (or encoding mismatch) | Verify the saved string and params |
| `"The provided value for parameter \"format\" is not valid."` (1013) | SCG/STL/DXF | Use OFB, STP, or IWP |
| `"No product could be loaded, expected a CC_Product"` | Format mismatch (e.g. OFB data as STP) | Match format to data |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

const data = (await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })).result.content

const loaded = await api.v1.common.load({
  data, format: 'OFB', encoding: 'base64', compression: 'deflate',
  doClear: 1, // no separate clear() needed
})
// loaded.result.id = root part; for OFB partId/eifId still work, for STP/IWP rediscover IDs
```

File-based (format auto-detected from extension, or pass `format`):

```js
await api.v1.common.load({ file: '/path/to/model.stp', format: 'STP' })
```

## Related

`common.save` · `common.clear` · `common.recalc` · `format-comparison.md`
