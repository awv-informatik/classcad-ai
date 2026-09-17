# Encoding/Compression Pipeline

How `common.save` / `common.load` encode data for JSON transport. Applies to all formats (OFB, STP, STL, SCG, IWP).

## Pipeline Order

```
Save:  raw data  ─→  deflateRaw  ─→  base64  ─→  JSON string
Load:  JSON string  ─→  base64-decode  ─→  inflateRaw  ─→  raw data
```

Matches the API docs: "If compression is also set, the decoding happens first!" (load) / "the decoding happens after compression!" (save).

## Combos

| `encoding` | `compression` | Works? | Use when |
|---|---|---|---|
| — | — | ✅ | Text formats (OFB, STP) when size doesn't matter |
| `'base64'` | — | ✅ | Binary formats (STL) without compression |
| `'base64'` | `'deflate'` | ✅ | **Always use this** — smallest, safest |
| — | `'deflate'` | ❌ | **Broken** |

**Never use `compression: 'deflate'` without `encoding: 'base64'`.** Compressed bytes (null, control chars, invalid UTF-8) are corrupted in JSON string transport; the string has an unstable length and cannot be loaded back.

## Parameter Matching Rule

Save and load params must match exactly (saved with `{ encoding: 'base64', compression: 'deflate' }` → load with the same). A mismatch gives only generic errors — no "wrong encoding" diagnostic:
```
"Import has to contain a CC_Product."
"Nothing could be loaded!"
```

## Raw Deflate (RFC 1951), not zlib

No zlib header (no `0x78` prefix). In Node.js use `deflateRawSync` / `inflateRawSync`; `deflateSync` / `inflateSync` fail with "incorrect header check".

## Node.js Recipes

```js
import { inflateRawSync, deflateRawSync } from 'node:zlib'

// Decode server output (deflate+base64)
const raw = inflateRawSync(Buffer.from(saved.result.content, 'base64'))
const text = raw.toString('utf-8') // text formats (OFB, STP); use the Buffer for STL

// Encode for the server — verified: manually encoded content loads
const b64String = deflateRawSync(Buffer.from(rawText, 'utf-8')).toString('base64')
await api.v1.common.load({ data: b64String, format: 'OFB', encoding: 'base64', compression: 'deflate' })
```

## Size Impact

Base64 adds a fixed 33% (4/3). Deflate+base64 vs base64 only (80×60×40 box):

| Format | base64 → deflate+base64 (chars) | Reduction |
|---|---|---|
| IWP (ASCII) | 48,650 → 3,770 | 92% |
| OFB | 44,260 → 5,660 | 87% (recommended) |
| SCG | 19,470 → 2,870 | 85% |
| STP | 12,700 → 2,880 | 77% |
| STL | 912 → 228 | 75% |

Before the base64 step, OFB deflates to ~12.8% of raw.

## OFB Binary Header

OFB is NOT pure ASCII:

```
[0x01][0x02]classcad[0x02][0x01]\n
Version=11\n
ApplicationClass=BuerliDemoApp\n
...
```

The control bytes survive JSON as ``/``, which is why raw OFB can round-trip through JSON — but base64 is safer.

## STL Binary Corruption

STL is binary by default. Without `encoding: 'base64'`, a raw save yields a ~32-char string — just the ASCII header ("STL Binary file created by SMLib"); all triangle data after the null terminator is silently lost. **Always use base64 for STL.**

## Gotchas

- **Content differs between saves** — OFB includes a `StateId` UUID that changes per save; byte comparison fails even for identical models.
- **File-based save/load ignores encoding/compression** — with `file:` the server reads/writes raw binary.

## Related

`save.md` · `load.md` · `format-comparison.md`
