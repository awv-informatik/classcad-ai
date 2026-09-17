# assembly.exportNode

Exports a node of the assembly tree — part template, assembly template (with its whole subtree of child templates and instances), instance, or root — as OFB or STP. Exporting an instance yields exactly the same content as exporting its template.

Prerequisites: `assembly.create`; a valid node ID.

## Key Parameters

- `id` — required; template, instance, or assembly root ID
- `format` — `'OFB'` (default) or `'STP'` only (no STL, IWP, SCG, …)
- `encoding` — `'base64'`
- `compression` — `'deflate'`. Pipeline: raw → deflate → base64. **Always pair with `encoding: 'base64'`** — raw deflate is binary, not JSON-safe
- `file` — absolute path on the ClassCAD server; `content` is then omitted. Format can be inferred from the extension (.ofb, .stp)
- `url` — **fire-and-forget**: reports success even if the target is unreachable. Avoid for critical exports

## Return Value

```js
{ result: { success: 1, content: "..." }, maxLevel: 31 }  // data export
{ result: { success: 1 }, maxLevel: 31 }                  // file export
{ result: undefined, messages: [...], maxLevel: 51 }      // error
```

`success` is `1`, not `true`. On error `result` is `undefined` (no `{ success: false }`) — check `maxLevel >= 51`. `content` is present only without `file`/`url`.

## Sizes (80×60×40 box)

Unencoded OFB is plaintext starting with `classcad\nVersion=11\n...`.

| Mode | Size |
|---|---|
| Raw OFB | ~36,000 chars |
| base64 only | ~48,000 chars |
| deflate only | ~560 chars (binary) |
| base64+deflate | ~5,900 chars |
| Raw STP | ~9,600 chars (~25% of OFB) |

## Roundtrip and common.save

OFB and STP roundtrip through `assembly.loadProduct` with matching `format`/`encoding`/`compression`; `loaded.result.id` is the imported template ID:

```js
const loaded = await api.v1.assembly.loadProduct({
  data: r.result.content, format: 'OFB', encoding: 'base64', compression: 'deflate',
})
```

`exportNode` exports one node/subtree (smaller); `common.save` saves the entire drawing plus drawing-level metadata — the content differs for the same assembly.

## Common Errors

| Error | Cause |
|---|---|
| "An element of parameter \"id\" has an invalid id!" | Bad or stale ID |
| "The parameter \"id\" must be provided!" | Missing `id` |
| "format is not valid. Possible values: [\"OFB\",\"STP\"]" | Unsupported format |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
await api.v1.assembly.setCurrentProduct({ id: tplId })
await api.v1.part.box({ id: tplId, name: 'Body', length: 80, width: 60, height: 40 })

const r = await api.v1.assembly.exportNode({
  id: tplId, format: 'OFB', encoding: 'base64', compression: 'deflate',
})
// r.result.success → 1, r.result.content → base64 deflated OFB
```

## Related

`assembly.loadProduct` · `common.save` · `common.load` · `assembly.from`
