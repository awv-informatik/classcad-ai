# sketch.loadFrom

Loads ONE sketch's geometry from an OFB (URL, file path, or inline data) into an existing sketch — like `copyFrom`, but from a file/blob. (`data`+base64 and `file` verified live; `url` documented but not live-tested — needs a server.)

## Key Parameters

- **`id`** (required) — destination sketch ID
- **`partId`** (required, unlike `copyFrom`) — part owning the destination sketch; omitted → 1004
- Source — exactly one of (mutually exclusive, like `common.save`/`common.load`):
  - **`data`** — inline OFB string (use `encoding: 'base64'` for binary-safe transfer)
  - **`url`** — URL to fetch
  - **`file`** — path reachable by the ClassCAD **process** (server-side, not client); with a local worker an absolute workspace path works
- **`encoding`** — `'base64'`; decoding happens before decompression. Must match how data was saved.
- **`compression`** — `'deflate'` if compressed; must match save
- **`format`** — default `'OFB'` (only documented format)
- **`name`** — sketch name inside the OFB; omitted → the first found sketch

## Return Value

VOID, maxLevel 31. No IDs for loaded elements (like `copyFrom`) — diff `getGeometry` before/after.

## Behavior

- **Merges, does not replace** — dest with 1 line → 5 lines after loading a 4-line rectangle.
- **`name` selects the sketch** in a multi-sketch OFB (`name:'B'` → rectangle, `name:'S'` → circle).
- **Without `name`, "first found in the file stream" ≠ creation order:** an OFB saved with 'S' (created first) then 'B' loaded 'B'. **Always pass `name` for multi-sketch OFBs.**
- Produce input with `common.save({ format: 'OFB', encoding: 'base64' })` → `result.content` (plus `result.success`). This saves the WHOLE drawing (all sketches, all parts); `loadFrom` extracts one.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1004 | "The parameter \"partId\" must be provided in the api call!" | `partId` omitted |
| 1004 | "Either data, file or url must be provided to load content from." | No source |
| 51 (code 0) | "The sketch with name \"NOPE\" couldn't be found in the of1 file stream" | `name` not in OFB — nothing loaded |
| 51 (code 0) | "Evaluation error in SketcherHelper.LoadSketch: Reading object failed…" | `data` isn't valid OFB |

## Usage Pattern

```js
// Source drawing with a sketch (saving an empty drawing fails)
const srcPart = (await api.v1.part.create({ name: 'Src' })).result
const srcSketch = (await api.v1.sketch.create({ id: srcPart, name: 'Profile' })).result
await api.v1.sketch.circle({ id: srcSketch, centerPos: [0, 0, 0], radius: 10 })
const ofbData = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result.content

await api.v1.common.clear()
const partId = (await api.v1.part.create({})).result
const skId = (await api.v1.sketch.create({ id: partId })).result
await api.v1.sketch.loadFrom({ id: skId, partId, data: ofbData, encoding: 'base64', format: 'OFB' })
// skId now holds the circle (with its constraints)
```

## Related

`sketch.copyFrom` · `sketch.copyGeometry` · `common.save` · `common.load`
