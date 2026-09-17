# part.updateImportFeature

Replaces an import feature's geometry entirely with new model data. Requires `openFeature` before and `closeFeature` after (then `recalc()`).

## Key Parameters

- `id` — **import feature ID** (from `importFeature`, NOT the part ID)
- `data` / `file` / `url` — new data source; replaces all existing imported geometry
- `format` — `"STP"` (match the data)
- `encoding` — `"base64"` if base64-encoded
- `compression` — `"deflate"` if deflate-compressed
- `name` — optional; existing name preserved if omitted

**A data source is always required** despite docs saying optional params keep existing values — omitting all gives code 1004. You cannot rename without also providing data.

## Return Value

Feature ID (same as input `id`), maxLevel=31. On error `null`, maxLevel=51.

## Gotchas

- **Without `openFeature`:** code 1200 "The provided feature is not allowed to update. It's not active and open."
- **Name-only update is a partial-success bug** — returns an error (maxLevel=51) but the name change IS applied; geometry unchanged.
- **Garbage data silently destroys geometry** — success (maxLevel=31, valid ID) but existing geometry is replaced with nothing (0 child solids). Destructive and irreversible; validate data first.
- **Body count follows the new data** — all child solids under the CC_Import are replaced: 2-body → 1-body STP leaves 1 solid; 1 → 3 adds solids.

## Common Errors

| Code | Message | Cause |
|---|---|---|
| 1200 | "The provided feature is not allowed to update. It's not active and open." | Forgot `openFeature` |
| 1004 | "Either data, file or url must be provided to load content from." | No data source |
| 1007 | "The provided id for the feature is not a feature or work geometry id." | Part ID instead of import feature ID |
| 1008 | "The provided file does not exist." | Invalid file path |

## Working Example

```js
const opts = { format: 'STP', compression: 'deflate', encoding: 'base64' }

// Two source models saved as STP
const boxPart = (await api.v1.part.create({ name: 'SrcBox' })).result
await api.v1.part.box({ id: boxPart, length: 50, width: 40, height: 30 })
const oldStp = (await api.v1.common.save(opts)).result.content
await api.v1.common.clear({})

const cylPart = (await api.v1.part.create({ name: 'SrcCyl' })).result
await api.v1.part.cylinder({ id: cylPart, diameter: 50, height: 50 })
const newStp = (await api.v1.common.save(opts)).result.content
await api.v1.common.clear({})

// Target with initial import, then replace its geometry
const tgtPart = (await api.v1.part.create({ name: 'Target' })).result
const importId = (await api.v1.part.importFeature({ id: tgtPart, data: oldStp, ...opts, name: 'MyImport' })).result

await api.v1.part.openFeature({ id: importId })
await api.v1.part.updateImportFeature({ id: importId, data: newStp, ...opts })
await api.v1.part.closeFeature({ id: importId })
await api.v1.common.recalc({})
```

## Related

`part.importFeature` · `part.openFeature` / `part.closeFeature`
