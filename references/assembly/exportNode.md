# assembly.exportNode

Exports a node (instance or template) from the assembly tree as OFB or STP data. Works on part templates, assembly templates, instances, and the assembly root. Exporting an instance yields the same content as exporting its template.

## Prerequisites

- `assembly.create` must have been called
- The node must exist (valid ID)

## Key Parameters

- `id` — required. ID of the node or template to export. Can be a template ID, instance ID, or assembly root ID.
- `format` — `'OFB'` (default) or `'STP'`. No other formats (STL, IWP) are supported.
- `encoding` — `'base64'`. Encodes the output. When combined with compression, the pipeline is: raw → deflate → base64.
- `compression` — `'deflate'`. Compresses the output. **Always combine with `encoding: 'base64'`** — raw deflate is binary and not JSON-safe.
- `file` — absolute path on the ClassCAD server's filesystem. When provided, `content` is omitted from the response. Format can be inferred from the file extension (.ofb, .stp).
- `url` — URL to send data to. **Fire-and-forget** — reports success even if the target is unreachable. Avoid for critical exports.

## Return Value

```js
// Success (data export, no file/url):
{ result: { success: 1, content: "..." }, messages: [], maxLevel: 31 }

// Success (file export):
{ result: { success: 1 }, messages: [], maxLevel: 31 }

// Error:
{ result: undefined, messages: [...], maxLevel: 51 }
```

- `success` is `1` (not `true`). On error, `result` is `undefined` — there is no `{ success: false }`.
- `content` is only present when neither `file` nor `url` is provided.

## Behavior

- **Instance ≡ template.** Exporting an instance produces identical content to exporting its template.
- **Assembly export includes subtree.** Exporting an assembly template includes all child templates and instances.
- **Default OFB is plaintext.** Without encoding, OFB content is raw text starting with `classcad\nVersion=11\n...`.
- **STP is smaller.** STP content is roughly 25% the size of OFB for the same geometry.
- **Compression is dramatic.** `deflate` reduces OFB from ~36KB to ~560 bytes for a simple box. `base64+deflate` is ~6KB.

## Size Comparison (80×60×40 box)

| Mode | Size |
|---|---|
| Raw OFB | ~36,000 chars |
| base64 only | ~48,000 chars |
| deflate only | ~560 chars (binary) |
| base64+deflate | ~5,900 chars |
| Raw STP | ~9,600 chars |

## Roundtrip with loadProduct

Export/import roundtrip works for both OFB and STP. Use matching encoding/compression params.

```js
// Export
const exported = await api.v1.assembly.exportNode({
  id: tplId,
  format: 'OFB',
  encoding: 'base64',
  compression: 'deflate',
})

// Import into another assembly
const loaded = await api.v1.assembly.loadProduct({
  data: exported.result.content,
  format: 'OFB',
  encoding: 'base64',
  compression: 'deflate',
})
// loaded.result.id → template ID of the imported product
```

## exportNode vs common.save

| Aspect | `exportNode` | `common.save` |
|---|---|---|
| Scope | Single node/subtree | Entire drawing |
| Output | Node data only | Drawing + metadata |
| Content | Different (smaller) | Different (larger) |
| Use case | Extract one part/sub-assembly | Save complete model |

They produce **different content** for the same assembly — `common.save` includes drawing-level metadata.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| "An element of parameter \"id\" has an invalid id!" | Bad or stale ID | Verify the ID exists |
| "The parameter \"id\" must be provided!" | Missing id param | Provide `id` |
| "format is not valid. Possible values: [\"OFB\",\"STP\"]" | Unsupported format | Use OFB or STP only |

## Gotchas

- **Only OFB and STP.** No STL, IWP, SCG, or other export formats.
- **Error result is `undefined`, not `{ success: false }`.** Check `maxLevel >= 51` for errors.
- **URL export is fire-and-forget.** Reports success without verifying delivery.
- **Raw deflate is binary.** Always pair `compression: 'deflate'` with `encoding: 'base64'`.
- **Instance export = template export.** The data is the same regardless of which you pass.

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
await api.v1.assembly.setCurrentProduct({ id: tplId })
await api.v1.part.box({ id: tplId, name: 'Body', length: 80, width: 60, height: 40 })

// Export as OFB with base64+deflate (best for data transport)
const r = await api.v1.assembly.exportNode({
  id: tplId,
  format: 'OFB',
  encoding: 'base64',
  compression: 'deflate',
})
// r.result.success → 1
// r.result.content → base64-encoded deflated OFB string
```

## Related

- `assembly.loadProduct` — import OFB/STP as template (pairs with exportNode for roundtrip)
- `common.save` — save the entire drawing (not just a node)
- `common.load` — load a complete model (replaces drawing)
- `assembly.from` — create assembly from JSON/ECXML (input-only, no OFB/STP)
