# Training: Encoding/Compression Pipeline

**Date:** 2026-04-16

## Goal

Studying the encoding/compression pipeline for `common.save` and `common.load`: how data flows between raw binary/text, deflate compression, and base64 encoding.

**Questions to answer:**

- What is the exact order of operations on save and load?
- What are the 4 combinations of encoding/compression, and which ones work?
- What does raw OFB content look like (text)? What does base64 content look like?
- What happens when you use deflate without base64 (corrupted binary in JSON)?
- What are the size ratios: raw vs base64-only vs deflate-only vs deflate+base64?
- Does roundtrip work with base64-only (no compression)?
- Does roundtrip work with deflate+base64?
- What happens with mismatched params on load (save with X, load without)?
- How do different formats (OFB, STP, STL) behave with the pipeline?
- Is the content actually valid base64 (alphabet check)?
- Can we manually decode base64 in JS and see what's inside?

---

## 01 — four encoding/compression combinations

Script: `scripts/01-four-combinations.mjs` — tested all 4 combos on OFB save.

**Data:** (see `files/01-four-combinations-size-summary.json`)

| Combo | String length | Notes |
|---|---|---|
| raw (none) | 33,201 | Plaintext OFB, starts with control bytes + `classcad\nVersion=11\n` |
| base64 only | 44,268 | Standard b64 encoding of raw content |
| deflate only | 263 | **Corrupted.** Binary deflated data garbled in JSON string |
| deflate+base64 | 5,660 | Compact, safe for JSON transport |

**Learned:** Four combos, three produce usable output. Deflate-only is broken for JSON transport — the binary data is corrupted/truncated. The deflate-only string length (263) is meaningless — it's the JS `.length` of garbled binary bytes, not the actual compressed data size.

**📌 LLM doc:** deflate without base64 is broken for data-string transport. Always pair them.

---

## 02 — raw OFB roundtrip

Script: `scripts/02-roundtrip-raw.mjs` — ✅ raw OFB roundtrip works.

**Data:** original 33,219 → resaved 34,435 (3.7% larger). Content doesn't match byte-for-byte because OFB includes session-specific metadata (StateId UUID changes between saves). Model geometry preserved, load returns id=4.

---

## 03 — base64-only roundtrip

Script: `scripts/03-roundtrip-b64.mjs` — ✅ base64-only roundtrip works.

**Data:** original 44,292 → resaved 45,916. Same 3.7% growth pattern as raw (different StateId). Load succeeds with id=4, maxLevel=31.

---

## 04 — deflate+base64 roundtrip

Script: `scripts/04-roundtrip-both.mjs` — ✅ deflate+base64 roundtrip works (the recommended pipeline).

**Data:** original 5,592 → resaved 5,744. Raw resave after load = 34,438 chars (confirms full model preserved). Load succeeds with id=4, maxLevel=31.

---

## 05 — mismatched encoding params on load

Script: `scripts/05-mismatch-load.mjs` — all mismatches fail.

**Data:** (see `files/05-mismatch-load-mismatch-results.json`)

Save was deflate+base64. Tried loading with:
- No params → error: "Import has to contain a CC_Product."
- base64 only → same error
- deflate only → same error
- Correct (deflate+base64) → ✅ success

**Learned:** Encoding params must match exactly between save and load. The server gives the same generic error for all mismatches — no "wrong encoding" diagnostic.

**📌 LLM doc:** params must match. Error message is generic, not helpful for diagnosing encoding mismatch.

---

## 06 — deflate-only roundtrip attempt

Script: `scripts/06-deflate-only-roundtrip.mjs` — deflate-only roundtrip **fails**.

**Data:** saved content is 405 chars (different from script 01's 263 — unstable because binary data is corrupted differently each time). 112/405 chars are non-printable. Load fails with "Import has to contain a CC_Product."

**Learned:** Deflate without base64 is doubly broken: (1) binary data is corrupted in JSON string transport, (2) even if you pass the corrupted data back, the server can't decompress it. This confirms: **never use `compression: 'deflate'` without `encoding: 'base64'`**.

---

## 07 — reverse mismatches

Script: `scripts/07-reverse-mismatch.mjs` — all reverse mismatches fail.

| Save with | Load with | Result |
|---|---|---|
| raw | base64 | ❌ fail |
| base64 | raw | ❌ fail |
| raw | deflate+base64 | ❌ fail |
| base64 | deflate+base64 | ❌ fail |

**Learned:** Mismatch is symmetric — it doesn't matter which direction. Save and load params must be identical.

---

## 08 — base64 validation

Script: `scripts/08-base64-validation.mjs` — base64 content is valid, decodes correctly.

**Data:**
- Both base64-only and deflate+base64 output pass the base64 alphabet regex `[A-Za-z0-9+/=]+`
- Base64 decoded length matches raw length (33,216)
- Decoded content starts with the OFB header (but `startsWith('classcad')` returned false — investigated in script 14)
- `inflateSync` failed with "incorrect header check" → compression is NOT zlib format

**📌 LLM doc:** ClassCAD uses raw deflate (RFC 1951), not zlib (RFC 1950). In Node.js, use `inflateRawSync`, not `inflateSync`.

---

## 09 — raw deflate confirmed

Script: `scripts/09-inflate-raw.mjs` — `inflateRawSync` succeeds where `inflateSync` fails.

**Data:**
- `inflateSync` → "incorrect header check" (no zlib header)
- `inflateRawSync` → succeeds, length=33,216
- First bytes of compressed data: `0xcd 0x1d 0x59 0x73` (not `0x78 0x...` zlib header)
- The decoded-vs-raw mismatch at index 371 is in `StateId=` field (UUID changes per save call, not corruption)
- True compression ratio: 4,250 bytes compressed / 33,216 raw = 12.8% (87.2% reduction before base64 overhead)

**📌 LLM doc:** Document raw deflate, the Node.js decode recipe, and compression ratio.

---

## 10 — STP encoding pipeline

Script: `scripts/10-stp-pipeline.mjs` — STP pipeline works the same as OFB.

**Data:** (see `files/10-stp-pipeline-stp-pipeline.json`)

| Combo | Size | Ratio vs raw |
|---|---|---|
| STP raw | 9,778 | 1.0x |
| STP base64 | 13,040 | 1.334x |
| STP deflate+b64 | 2,992 | 0.306x |

- STP is pure ASCII text (ISO-10303-21), 0 non-printable chars
- `inflateRawSync` produces exact same length as raw (9,778)
- Roundtrip succeeds (id=11 — STP changes IDs as expected)

---

## 11 — STL encoding pipeline (binary format)

Script: `scripts/11-stl-pipeline.mjs` — STL confirms binary corruption without base64.

**Data:** (see `files/11-stl-pipeline-stl-pipeline.json`)

| Combo | String length | Actual data |
|---|---|---|
| STL raw | 32 | **Truncated!** Only the ASCII header "STL Binary file created by SMLib" survives |
| STL base64 | 110,780 | Correct — decodes to 684 bytes (80-byte header + 4-byte count + 12 triangles × 50 bytes) |
| STL deflate+b64 | 25,072 | 22.6% of base64 size |

- `inflateRawSync` on deflate+b64 content matches decoded base64 buffer exactly (`Buffer.compare === 0`)
- The 32-char raw STL is the textbook case: binary data after the null-terminated ASCII header is lost in JSON string encoding

**📌 LLM doc:** STL MUST use base64. Raw save truncates to header only.

---

## 12 — manual encode/decode in Node.js

Script: `scripts/12-manual-encode-decode.mjs` — **manual client-side encoding works**.

**Data:**
- `deflateRawSync(rawOFB)` → base64 = 5,584 chars (server's version = 5,664, slight difference due to different StateId)
- Server's deflate+base64 content decodes via `Buffer.from(b64, 'base64')` → `inflateRawSync` → OFB text
- **Critical test:** manually compressed+encoded OFB sphere was loaded by server successfully (id=4, maxLevel=31)

**Learned:** The entire pipeline is reproducible in Node.js. You can compress on the client with `deflateRawSync` and the server will accept it. You can decompress server output with `inflateRawSync`.

**📌 LLM doc:** Document the Node.js encode/decode recipes.

---

## 13 — comprehensive size matrix

Script: `scripts/13-base64-only-both-sizes.mjs` — size comparison across all 5 formats.

**Data:** (see `files/13-base64-only-both-sizes-size-matrix.json`)

Model: box + sphere (mixed flat + curved geometry).

| Format | Raw | Base64 | Deflate+B64 | Compression ratio |
|---|---|---|---|---|
| OFB | 40,708 | 54,280 | 7,376 | 81.9% reduction |
| STP | 14,635 | 19,516 | 4,064 | 72.2% reduction |
| STL | 32* | 110,780 | 25,072 | — |
| SCG | 84,030 | 112,040 | 23,680 | 71.8% reduction |
| IWP | 51,396 | 68,528 | 6,012 | 88.3% reduction |

*STL raw = corrupted (only header).

Base64 overhead is consistently 1.333x (4/3). IWP compresses best, then OFB. STL is huge for curved surfaces (sphere tessellation).

**📌 LLM doc:** Size matrix and compression ratios.

---

## 14 — OFB binary header

Script: `scripts/14-ofb-leading-bytes.mjs` — OFB has binary framing, not pure text.

**Data:**
- Byte 0: `0x01`, Byte 1: `0x02` (binary prefix)
- Bytes 2-9: `classcad` (magic string)
- Byte 10: `0x02`, Byte 11: `0x01` (binary suffix)
- Byte 12: `0x0a` (newline)
- Then: `Version=11\n...` (plain text body)
- `rawContent.startsWith('classcad')` → false (starts at index 2, not 0)

**Learned:** OFB is NOT pure text — it has a binary header `[0x01][0x02]classcad[0x02][0x01]`. These control chars survive JSON transport as escaped Unicode (`\u0001`, `\u0002`), which is why raw OFB can round-trip through JSON. But it's still binary-framed, which makes base64 the safer choice.

**📌 LLM doc:** OFB binary header structure.

---

## 15 — encoding order verification

Script: `scripts/15-encoding-order.mjs` — verified the pipeline order bidirectionally.

**Data:**
- Save pipeline confirmed: data → deflateRaw → base64
  - `Buffer.from(b64, 'base64')` = 4,186 bytes (compressed)
  - `inflateRawSync(compressed)` = 33,207 bytes (original OFB)
- Load pipeline confirmed: base64-decode → inflateRaw → data
  - Manual `deflateRawSync(raw)` → base64 → load succeeds (id=4, maxLevel=31)

**📌 LLM doc:** Pipeline order diagram with Node.js recipes.

---

## Summary

All questions answered:

1. **Order:** Save: data → deflateRaw → base64. Load: base64-decode → inflateRaw → data.
2. **4 combos:** raw ✅, base64-only ✅, deflate-only ❌ (broken), deflate+base64 ✅
3. **Raw OFB:** has binary header `[0x01 0x02]classcad[0x02 0x01]` + text body
4. **Deflate without base64:** binary data corrupted in JSON — unstable length, fails on reload
5. **Size ratios:** base64 adds 33%, deflate+base64 reduces 72-88% depending on format
6. **Roundtrips:** raw ✅, base64-only ✅, deflate+base64 ✅
7. **Mismatch:** any mismatch fails with generic "Import has to contain a CC_Product" error
8. **Across formats:** pipeline works identically for OFB, STP, STL, SCG, IWP
9. **Valid base64:** confirmed via regex and manual decode
10. **Manual JS decode:** confirmed — `inflateRawSync` (not `inflateSync`) + `Buffer.from(b64, 'base64')`
11. **Compression type:** raw deflate (RFC 1951), not zlib (RFC 1950)
