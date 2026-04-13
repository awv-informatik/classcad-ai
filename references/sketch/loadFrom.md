# sketch.loadFrom

<!-- UNVERIFIED: ClassCAD server was unreachable during training (2026-04-13). All content derived from source API docs + patterns from sketch.copyFrom training. Needs live verification. -->

Loads sketch geometry from an OFB file (by URL, file path, or inline data) and copies it into an existing sketch.

## Prerequisites

- A part (`part.create`)
- A sketch to load into (`sketch.create` or `part.sketch`)
- An OFB file/data containing a sketch — produced via `common.save({ format: 'OFB', ... })`

## Key Parameters

- **`id`** (required) — destination sketch ID. The sketch that will receive the loaded geometry.
- **`partId`** (required) — the part that owns the destination sketch.
- **`data`** — inline OFB content (string). Use with `encoding: 'base64'` for binary-safe transfer.
- **`url`** — URL to fetch the OFB file from.
- **`file`** — local file path to the OFB file (must be reachable by the ClassCAD process).
- **`encoding`** — `'base64'` if the data is base64-encoded. Decoding happens before decompression.
- **`compression`** — `'deflate'` if the data is compressed.
- **`format`** — defaults to `'OFB'`. Only OFB is documented for this API.
- **`name`** — name of the sketch in the loaded OFB file. If omitted, the first found sketch is used.

**Source selection:** Provide exactly one of `data`, `url`, or `file`. They are mutually exclusive (same pattern as `common.save`/`common.load`).

## Return Value

`VOID` (null). Check `maxLevel` for errors.

## Behavior (from docs — UNVERIFIED)

- Copies sketch geometry from the OFB file's sketch into the destination sketch.
- Similar to `copyFrom` but loads from a file/data source instead of an in-memory sketch.
- When the OFB contains multiple sketches, use the `name` param to select which one. Without `name`, the first sketch is used.
- Likely merges geometry (does not replace), consistent with `copyFrom` behavior — but needs verification.

## Usage Pattern

```js
// Save current drawing as OFB base64
const saveResult = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
const ofbData = saveResult.result.content

// Create new part + sketch, load from saved data
const partId = (await api.v1.part.create({})).result
const skId = (await api.v1.sketch.create({ id: partId })).result

await api.v1.sketch.loadFrom({
  id: skId,
  partId: partId,
  data: ofbData,
  encoding: 'base64',
  format: 'OFB',
})
```

## Gotchas (inferred — UNVERIFIED)

- Unlike `copyFrom` which takes `toCopyId` (an in-memory sketch), `loadFrom` requires `partId` in addition to `id`. Both are mandatory.
- The `encoding`/`compression` params must match how the data was saved. If you saved with `encoding: 'base64'`, you must load with `encoding: 'base64'`.
- `file` paths must be reachable by the ClassCAD process, not the client.

## Related

- `sketch.copyFrom` — copies geometry from an in-memory sketch to another sketch. Simpler when both sketches exist in the same session.
- `sketch.copyGeometry` — copies specific elements within or between sketches, with translation offset.
- `common.save` — produces OFB data/files that `loadFrom` can consume.
- `common.load` — loads an entire drawing from a file (replaces everything), vs. `sketch.loadFrom` which targets a single sketch.
