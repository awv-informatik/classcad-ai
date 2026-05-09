# assembly.from

Creates an assembly from a JSON, XML, or ECXML structured definition. **Effectively unusable** — the JSON/ECXML data formats are undocumented and no working examples exist.

## What It Does

- **Clears the drawing** and creates a new assembly root
- Returns the root assembly ID
- Accepts `data` (string), `file` (local path), or `url` parameters
- Requires `format` param when using `data` or `url` (values: `"JSON"`, `"XML"`, `"ECXML"`)
- For `file`, format is inferred from extension (`.json`, `.xml`, `.ecxml`)

## JSON Format (Partially Discovered)

The top-level structure is `{ templates: [], instances: [], constraints: [] }`. Empty arrays create a valid assembly root identical to `assembly.create()`.

```js
// This works — creates an empty assembly (equivalent to assembly.create)
const r = await api.v1.assembly.from({
  data: JSON.stringify({ templates: [], instances: [], constraints: [] }),
  format: 'JSON',
})
// r.result → assembly root ID, r.maxLevel → 31
```

**Template, instance, and constraint entry formats are unknown.** Adding any entry to these arrays fails with internal errors. Over 60 field name combinations were tested — none produce a valid result.

## ECXML / XML Format

The ECXML parser exists but most XML element types are "not implemented." Attempting to use `<assembly>` as an element **hangs the ClassCAD worker** (100% CPU, requires kill -9).

## What NOT to Do

- **Do not pass OFB/STP data** — `from()` explicitly rejects them: "It's not possible to create assembly from other formats than json, xml or ecxml."
- **Do not pass `<assembly>` element in ECXML** — causes a server hang.
- **Do not expect to export JSON/ECXML** — `exportNode` only supports OFB/STP, `common.save` supports OFB/SCG/STP/IWP/STL/DXF. The JSON/ECXML format is input-only with no way to generate valid examples.

## Gotchas

- Clears existing drawing content (like `common.clear()`)
- The `name` field in JSON is ignored — root is always named "AssemblyRoot"
- With empty arrays, `from()` is functionally identical to `common.clear() + assembly.create()`
- Returns a result ID even on error (maxLevel 51) — always check `maxLevel`

## Use Instead

For building assemblies programmatically, use the standard APIs:

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
// ... build geometry in template ...
await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId })).result
```

For importing existing geometry into an assembly, use `assembly.loadProduct`:

```js
const loaded = (await api.v1.assembly.loadProduct({
  data: ofbBase64,
  format: 'OFB',
  encoding: 'base64',
})).result
// loaded.id → template ID of the imported product
```

## Related

- `assembly.create` — create an empty assembly (preferred)
- `assembly.loadProduct` — import OFB/STP as template (preferred for importing)
- `assembly.exportNode` — export a node as OFB/STP (no JSON/ECXML export)
- `common.load` — load a complete OFB file (replaces drawing)
