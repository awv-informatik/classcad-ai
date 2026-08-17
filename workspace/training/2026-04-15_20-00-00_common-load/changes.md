# Changes — common.load training

## New file: `references/common/load.md`

```diff
+# common.load
+
+Loads a model from a data string, file path, or URL into the drawing. The drawing must be empty or `doClear` must be set. Returns the root product ID.
+
+## Prerequisites
+
+- Drawing must be cleared first (`common.clear({})`), OR pass `doClear: 1` to auto-clear before loading.
+- Without clearing: error `"There is already a model which must be removed first."` (maxLevel=51).
+
+## Key Parameters
+
+- **Source** (pick one):
+  - `data` — content string (from a prior `common.save` data-string output)
+  - `file` — absolute path on the ClassCAD server's filesystem
+  - `url` — URL to fetch the file from
+  - If none provided: error code 1004, `"Either data, file or url must be provided."`
+- `format` — `'OFB'`, `'STP'`, or `'IWP'` only. **SCG, STL, DXF cannot be loaded** (code 1013). Auto-detected from file extension (`.ofb`, `.stp`) or data content for OFB. Best practice: specify explicitly.
+- `doClear` — set to `1` (TRUE) to auto-clear the drawing before loading. Preferred over a separate `clear()` call.
+- `encoding` — `'base64'`. Must match the encoding used on save.
+- `compression` — `'deflate'`. Must match the compression used on save.
+- `stp.asPart` — set to `1` (TRUE) to flatten assembly structure into a single part. Works but generates an error-level message (`"CreateNamedPoint not found"`, maxLevel=51). Geometry loads fine despite the error.
+- `ofb.geometry` — 2 (geometry), 3 (graphics), 4 (both). No observable effect in CLI mode. Default (2) is fine.
+- `ident` — documented as "custom string identifier for the loaded root product". No observable effect in testing (OFB). May only apply to non-OFB imports.
+
+## Result Structure / ID Preservation / Supported Formats / Gotchas / Common Errors / Working Examples
+
+(Full content in the file — 137 lines covering all tested behavior)
```

Key findings documented:
- Only OFB/STP/IWP can be loaded (SCG/STL/DXF are export-only)
- OFB preserves ALL IDs; STP and IWP change IDs
- `doClear: 1` is the preferred approach
- No `recalc()` needed after load
- `stp.asPart` produces maxLevel=51 but geometry loads fine
- `ident` and `ofb.geometry` have no observable CLI effect
- Comprehensive error message table
