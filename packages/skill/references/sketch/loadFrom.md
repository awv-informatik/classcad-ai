# sketch.loadFrom

<!-- Verified live 2026-07-01 (data+base64 and file paths). url path documented but not live-tested (needs a server). -->

Loads sketch geometry from an OFB file (by URL, file path, or inline data) and copies it into an existing sketch.
Like `copyFrom`, but the source is a file/data blob rather than an in-memory sketch.

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

`VOID` (null), `maxLevel 31` on success. Check `maxLevel`/`messages` for errors.

## Behavior (verified 2026-07-01)

- Copies the geometry of ONE sketch from the OFB into the destination sketch.
- **Merges, does not replace** — the destination keeps its existing geometry and gains the loaded geometry (verified: a dest with 1 line → 5 lines after loading a 4-line rectangle).
- **`name` selects which sketch** to load from a multi-sketch OFB (`name:'B'` → the rectangle; `name:'S'` → the circle). Verified.
- **Without `name`, exactly one sketch is loaded — the "first found in the file stream", which is NOT necessarily creation order.** In testing, an OFB saved with sketch 'S' (created first) then 'B' loaded 'B' when no name was given. **Always pass `name` if the OFB has more than one sketch** — don't rely on ordering.
- Verified with both `data` (base64) and `file` (absolute local path). `file` must be reachable by the ClassCAD **process** (server-side), not the client — since the worker runs locally here, an absolute workspace path works.

Produce the OFB with `common.save({ format: 'OFB', encoding: 'base64' })` → `result.content` is the base64 string (`result` also carries `success`). This saves the WHOLE drawing (all sketches on all parts); `loadFrom` then extracts one sketch by `name`.

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

## Gotchas (verified 2026-07-01)

- Unlike `copyFrom` (which takes `toCopyId`, an in-memory sketch), `loadFrom` requires **`partId` in addition to `id`** — both mandatory. Omitting `partId` → error 1004.
- The `encoding`/`compression` params must match how the data was saved. Saved with `encoding: 'base64'` → load with `encoding: 'base64'` (decode happens before decompression).
- `file` paths must be reachable by the ClassCAD **process** (server-side), not the client.
- Without `name`, ordering is not guaranteed to be creation order — pass `name` for a deterministic result on multi-sketch OFBs.
- Returns no IDs for the loaded elements (like `copyFrom`). Diff `getGeometry` before/after if you need them.

## Common Errors (verified)

| Code | Message | Cause |
|------|---------|-------|
| 1004 | "The parameter \"partId\" must be provided in the api call!" | `partId` omitted |
| 1004 | "Either data, file or url must be provided to load content from." | No source given |
| 51 (code 0) | "The sketch with name \"NOPE\" couldn't be found in the of1 file stream" | `name` not present in the OFB — nothing loaded |
| 51 (code 0) | "Evaluation error in SketcherHelper.LoadSketch: Reading object failed…" | `data` is not valid OFB content |

## Related

- `sketch.copyFrom` — copies geometry from an in-memory sketch to another sketch. Simpler when both sketches exist in the same session.
- `sketch.copyGeometry` — copies specific elements within or between sketches, with translation offset.
- `common.save` — produces OFB data/files that `loadFrom` can consume.
- `common.load` — loads an entire drawing from a file (replaces everything), vs. `sketch.loadFrom` which targets a single sketch.
