# Changes — Encoding/Compression Pipeline

## New file: `references/common/encoding-pipeline.md`

```diff
+# Encoding/Compression Pipeline
+
+How `common.save` and `common.load` encode data for JSON transport.
+
+## Pipeline Order
+Save:  raw data → deflateRaw → base64 → JSON string
+Load:  JSON string → base64-decode → inflateRaw → raw data
+
+## The Three Working Combos
+Raw ✅, Base64-only ✅, Deflate+Base64 ✅, Deflate-only ❌ (broken)
+
+## Key findings:
+- ClassCAD uses raw deflate (RFC 1951), NOT zlib
+- In Node.js: use inflateRawSync/deflateRawSync, NOT inflateSync/deflateSync
+- Save/load encoding params must match exactly — generic error on mismatch
+- OFB has binary header [0x01][0x02]classcad[0x02][0x01]
+- STL raw save truncates to 32-char header — MUST use base64
+- Deflate without base64 produces corrupted binary in JSON
+- Manual client-side encode/decode with Node.js zlib verified working
+- Compression ratios: IWP 88%, OFB 82%, STP 72%, SCG 72%
```

Full diff is the entire new file (130 lines). See `knowledge/classcad-skill/references/common/encoding-pipeline.md`.
