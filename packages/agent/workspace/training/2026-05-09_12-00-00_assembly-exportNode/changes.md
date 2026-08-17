# Changes — assembly.exportNode

## New file: `references/assembly/exportNode.md`

```diff
+# assembly.exportNode
+
+Exports a node (instance or template) from the assembly tree as OFB or STP data. Works on part templates, assembly templates, instances, and the assembly root. Exporting an instance yields the same content as exporting its template.
+
+## Prerequisites
+
+- `assembly.create` must have been called
+- The node must exist (valid ID)
+
+## Key Parameters
+
+- `id` — required. ID of the node or template to export. Can be a template ID, instance ID, or assembly root ID.
+- `format` — `'OFB'` (default) or `'STP'`. No other formats (STL, IWP) are supported.
+- `encoding` — `'base64'`. Encodes the output. When combined with compression, the pipeline is: raw → deflate → base64.
+- `compression` — `'deflate'`. Compresses the output. **Always combine with `encoding: 'base64'`** — raw deflate is binary and not JSON-safe.
+- `file` — absolute path on the ClassCAD server's filesystem. When provided, `content` is omitted from the response. Format can be inferred from the file extension (.ofb, .stp).
+- `url` — URL to send data to. **Fire-and-forget** — reports success even if the target is unreachable. Avoid for critical exports.
+
+## Return Value
+
+- `success` is `1` (not `true`). On error, `result` is `undefined` — there is no `{ success: false }`.
+- `content` is only present when neither `file` nor `url` is provided.
+
+## Key Findings
+
+- Instance ≡ template content (identical export data)
+- Assembly exports include full subtree
+- Deflate compression: 36KB → 560 bytes for simple box
+- OFB+STP roundtrip with loadProduct works
+- exportNode ≠ common.save (different content for same assembly)
+- URL export is fire-and-forget (no delivery verification)
+- Only OFB and STP supported (no STL, IWP, SCG)
```
