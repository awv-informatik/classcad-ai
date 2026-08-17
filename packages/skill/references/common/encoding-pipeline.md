# Encoding/Compression Pipeline

How `common.save` and `common.load` encode data for JSON transport. This applies to all formats (OFB, STP, STL, SCG, IWP).

## Pipeline Order

```
Save:  raw data  ─→  deflateRaw  ─→  base64  ─→  JSON string
Load:  JSON string  ─→  base64-decode  ─→  inflateRaw  ─→  raw data
```

The server applies compression first, then encoding on save. On load, it decodes first, then decompresses. This matches the API docs: "If compression is also set, the decoding happens first!" (load) / "the decoding happens after compression!" (save).

## The Three Working Combos

| Combo | `encoding` | `compression` | Works? | Use when |
|---|---|---|---|---|
| Raw | — | — | ✅ | Text formats (OFB, STP) when size doesn't matter |
| Base64 only | `'base64'` | — | ✅ | Binary formats (STL) without compression |
| Deflate + Base64 | `'base64'` | `'deflate'` | ✅ | **Always use this** — smallest, safest |
| Deflate only | — | `'deflate'` | ❌ | **Broken.** Binary corrupted in JSON |

**Deflate without base64 is broken.** The compressed binary data contains arbitrary bytes (including null, control chars, invalid UTF-8) that get corrupted in JSON string transport. The resulting string has an unstable length and cannot be loaded back. Never use `compression: 'deflate'` without `encoding: 'base64'`.

## Parameter Matching Rule

Save and load encoding params must match exactly. Any mismatch produces a generic error:
```
"Import has to contain a CC_Product."
"Nothing could be loaded!"
```
There is no "wrong encoding" diagnostic. If you saved with `{ encoding: 'base64', compression: 'deflate' }`, you must load with exactly those same params.

## Compression Type: Raw Deflate (RFC 1951)

ClassCAD uses **raw deflate**, NOT zlib-wrapped deflate (RFC 1950). The compressed output has no zlib header — the first bytes are raw deflate stream data, not the `0x78` zlib prefix.

In Node.js, you must use `deflateRawSync` / `inflateRawSync`, NOT `deflateSync` / `inflateSync`. Standard zlib functions fail with "incorrect header check".

## Node.js Recipes

### Decode server output (load pipeline)

```js
import { inflateRawSync } from 'node:zlib'

// Given: server sent deflate+base64 content
const b64String = saved.result.content

// Step 1: base64 decode → compressed buffer
const compressed = Buffer.from(b64String, 'base64')

// Step 2: raw inflate → original data
const raw = inflateRawSync(compressed)
const text = raw.toString('utf-8') // for text formats (OFB, STP)
// For binary formats (STL), use the Buffer directly
```

### Encode for server (save pipeline)

```js
import { deflateRawSync } from 'node:zlib'

// Given: raw OFB text content
const rawText = '...'

// Step 1: deflateRaw compress
const compressed = deflateRawSync(Buffer.from(rawText, 'utf-8'))

// Step 2: base64 encode
const b64String = compressed.toString('base64')

// Load it: server accepts this
await api.v1.common.load({
  data: b64String,
  format: 'OFB',
  encoding: 'base64',
  compression: 'deflate',
})
```

This has been verified — manually encoded content loads successfully.

## Size Impact

Base64 adds a fixed 33% overhead (4/3 ratio). Deflate compression ratios vary by format:

| Format | Deflate+B64 vs Raw | Notes |
|---|---|---|
| IWP | 11.7% of raw (88% reduction) | Best compression |
| OFB | 18.1% of raw (82% reduction) | Recommended format |
| STP | 27.8% of raw (72% reduction) | Good compression |
| SCG | 28.2% of raw (72% reduction) | Similar to STP |
| STL | — | Raw is corrupted; vs base64: 22.6% |

True deflate compression (before base64 overhead) is even better — OFB compresses to ~12.8% of raw size. The base64 step adds 33% back on top.

## OFB Binary Header

OFB is NOT pure ASCII. It has a binary framing structure:

```
[0x01][0x02]classcad[0x02][0x01]\n
Version=11\n
ApplicationClass=BuerliDemoApp\n
...
```

The 2-byte prefix (`0x01 0x02`) and suffix (`0x02 0x01`) around "classcad" are binary control bytes. They survive JSON transport as escaped Unicode (`\u0001`, `\u0002`), which is why raw OFB can technically round-trip through JSON. But base64 is the safer transport mechanism.

## STL Binary Corruption

STL is binary by default. Without `encoding: 'base64'`, the raw save produces a JSON string of only ~32 characters — just the ASCII header ("STL Binary file created by SMLib"). All geometry data (triangle mesh) after the null terminator is silently lost.

**Always use `encoding: 'base64'` for STL.**

## Gotchas

- **Deflate only = broken.** Never use `compression: 'deflate'` without `encoding: 'base64'`.
- **Params must match.** No helpful error message on mismatch — just generic load failure.
- **Raw deflate, not zlib.** Use `inflateRawSync` / `deflateRawSync` in Node.js.
- **OFB has binary bytes.** Don't assume it's pure text — it has a binary header.
- **Content differs between saves.** OFB includes a `StateId` UUID that changes per save call. Byte-for-byte comparison will fail even for identical models.
- **File-based save/load ignores encoding/compression.** These params only affect data-string transport. When using `file:` parameter, the server reads/writes raw binary directly.

## Related

- `save.md` — full save API documentation
- `load.md` — full load API documentation
- `format-comparison.md` — format capabilities and size comparison
