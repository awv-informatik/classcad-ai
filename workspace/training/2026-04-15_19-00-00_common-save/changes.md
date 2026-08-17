# Changes — common.save training

## New file: `references/common/save.md`

```diff
+# common.save
+
+Serializes the current drawing to a data string or file in the specified format. By default returns the model as an OFB data string.
+
+## Prerequisites
+
+- At least `part.create` must have been called. Saving an empty drawing fails with `"No root product could be found."` and `"There is nothing to be stored."` (maxLevel=51, success=0).
+
+## Key Parameters
+
+- `format` — `'OFB'` (default), `'STP'`, `'STL'`, `'SCG'`, `'IWP'`. DXF is documented but **broken in classcad-cli** (missing template file).
+- `encoding` — `'base64'`. Always use this for data-string saves. Without it, binary formats (STL, compressed OFB) produce corrupted content in JSON strings.
+- `compression` — `'deflate'`. **Never use without `encoding: 'base64'`** — raw deflated binary data is garbled in JSON string transport.
+- `file` — write to a local file path instead of returning content. When set, `content` is absent from the result.
+- `url` — POST the data to a URL instead of returning content.
+
+## Result Structure
+
+- success is numeric 1/0, NOT boolean true/false
+- content only present when no file/url is set
+- Check `success`, not `maxLevel` — stp.analytic=1 sets maxLevel=51 but still produces valid content
+
+## The Practical Pipeline
+
+- `{ format: 'OFB', encoding: 'base64', compression: 'deflate' }` — ~87% smaller than raw OFB
+- Order: save = data → deflate → base64. Load = base64-decode → inflate → data.
+
+## Format Comparison (same box, base64)
+
+- OFB deflate+b64: ~5,700 (best roundtrip)
+- STP: ~13,000 (interchange standard)
+- STL: ~900 (mesh only, varies wildly with curvature)
+- IWP binary: ~22,000
+
+## Key Gotchas
+
+- DXF broken in CLI (missing template)
+- STL MUST use encoding:'base64' — binary content corrupted without it
+- Deflate without base64 = garbled binary
+- OFB preserves parametric data + root ID; STP/STL do not
+- stp.header options have no effect on data-string output
+- ofb.version and ofb.geometry have no observable effect in CLI mode
+- stl.binary flag may not work in data-string mode
```
