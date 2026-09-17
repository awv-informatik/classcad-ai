# assembly.from

Builds an assembly from a JSON definition — templates (from URL / base64 / inline geometry), instances, and constraints — in one call. **Clears the drawing first** (like `common.clear()` + `assembly.create({ name })`); anything built before is gone. Returns the root assembly ID.

> ECXML / XML formats are accepted by the parser but **non-functional** — no element types are implemented; `<assembly>` was previously observed to hang the worker. Use JSON only.

> Schema source of truth: `cclasses/Source/BaseModeling/JsonAssemblyBuilder.cclass` (v0) and `JsonAssemblyBuilder_v1.cclass` (v1). The upstream `assembly_building.md` documents v1 but omits the required `"version": 1` flag — add it when copying that example.

## Schema versions

Top-level `version` selects the schema (default v0). Both dispatch to the same `assembly.*` APIs with identical results.

| | v0 (default, omit `version`) | v1 (`"version": 1`) |
|---|---|---|
| Constraint `type` | `CC_FastenedConstraint`, … | `FastenedConstraint`, … |
| Inline geometry `type` | `CC_Box`, `CC_WorkCSys` | `Box`, `WorkCSys` |
| Everything else | identical | identical |

## Top-level fields

```ts
{
  version?: 1,          // omit/0 = v0
  nameIfRoot?: string,  // root name (default "AssemblyRoot")
  templates: Template[],
  instances: Instance[],
  constraints: Constraint[],   // all three arrays required, even if empty
  userData?: { [key: string]: any },
}
```

`nameIfRoot` is the only top-level naming field; top-level `ident`, `name`, etc. are **silently ignored**.

## Template

`{ ident, type: "part" | "assembly", userData?, ...source }` — `ident` becomes the part/sub-assembly name.

**`type: "part"`** — one source, in priority order:

| Field | Shape | Notes |
|---|---|---|
| `base64` | base64-encoded OFB | implicit format OFB; use it to embed local bytes |
| `reference` | `{ location: <URL>, type: "ofb" \| "stp" }` | **HTTP/HTTPS URL only** — local paths, `file:///…`, pre-loaded template IDs fail (`IO_Helper.IoOfbImportStream: Nothing could be found to import!`) |
| `geometry` | `Geometry[]` | inline primitives, only two types (below) |

- `{ type: "CC_Box" / "Box", ident, width, length, height }`
- `{ type: "CC_WorkCSys" / "WorkCSys", ident, inverted?: 0|1, transform?: <4x4-matrix-string> }` — note: a **4x4** matrix here, unlike `instance.transform`

For richer geometry, build a part with the regular API, save the OFB, host it, and reference its URL.

**`type: "assembly"`** — needs `reference: { location: <URL>, type: "json" }` or inline `assembly: { templates, instances, constraints }` (recursive, same schema). Flat `instances`/`constraints` on the template body are ignored. **Template lookups are global within one `from()` call** — a sub-assembly can use templates defined in its parent and vice versa.

## Instance

`{ ident, template, transform?, userData? }` — `ident` unique within owner; `template` is a template ident.

**`transform` is a STRING**, evaluated server-side via `OBJ_StrEval`: `"[[50, 30, 10], [1, 0, 0], [0, 1, 0]]"` (origin + xDir + yDir, same shape as `assembly.instance`). The field name `transformation` is **silently ignored**. On a sub-assembly instance it propagates to all instances inside.

## Constraint

`{ type, mate1?, mate2?, instances?, userData?, ...params }` — all named parameters of the underlying method pass through unchanged (`name`, `xOffset`…`zRotation`, `useCurrentTransform`, …). `instances: [<ident>]` is only for LinearPattern.

| `type` (v0) | `type` (v1) | Underlying API |
|---|---|---|
| `CC_FastenedOriginConstraint` | `FastenedOriginConstraint` | `assembly.fastenedOrigin` (mate1 only) |
| `CC_FastenedConstraint` | `FastenedConstraint` | `assembly.fastened` |
| `CC_CylindricalConstraint` | `CylindricalConstraint` | `assembly.cylindrical` |
| `CC_RevoluteConstraint` | `RevoluteConstraint` | `assembly.revolute` |
| `CC_PlanarConstraint` | `PlanarConstraint` | `assembly.planar` |
| `CC_ParallelConstraint` | `ParallelConstraint` | `assembly.parallel` |
| `CC_SliderConstraint` | `SliderConstraint` | `assembly.slider` |
| `CC_LinearPatternConstraint` | `LinearPatternConstraint` | `assembly.linearPattern` — in the parser, but a test failed with "Instance not found: B"; use `assembly.linearPattern` after `from()` until understood |

**Not supported** — call the imperative API after `from()`: Spherical, Gear, Group, CircularPattern, Update3DConstraintValue.

### Mate

```ts
{ path: [<instance-ident>, ...], csys: string, flip?: "Z"|"-Z"|"X"|"-X"|"Y"|"-Y", reorient?: "0"|"90"|"180"|"270" }
```

- `path` — instance idents through the hierarchy: `["Bolt_Instance"]` top-level, `["NB1", "Bolt_Inst"]` inside a sub-assembly.
- `csys` — the **name** of a `CC_WorkCSys` in the part of `path[0]`, resolved via `part.getWorkGeometry({ id, name })`.

## Return Value

`r.result` = root assembly ID, maxLevel 31. On error maxLevel ≥ 51 with `jsonAsmBuilder.*` messages — **partial structures may still be created**, so always check `maxLevel`.

## Gotchas

- **`format` is honored for `data` and `url`, not `file`** — the file path infers format from the extension and rejects unknown extensions even when `format` is set.

## Common Errors

| Error | Cause |
|---|---|
| `Unknown constraint type!` | Wrong `type` (missing `CC_` in v0, or unsupported) |
| `Instance not found: <ident>` | Mate path ident doesn't exist in the current scope |
| `Mate coord system not found: /<inst>/<csys>` | csys NAME not on the template — check the OFB's WCS names (e.g. `WCS_Origin`, `WCS_Nut`, `WCS_Hole-Top`) |
| `Nothing could be found to import` | `reference.location` is a local path or unreachable URL |
| `It's not possible to create assembly from other formats than json, xml or ecxml` | `file` has the wrong extension; `format` doesn't override it |
| `Type error: ... NullMem ... defined as type Array addressed` | Missing required `templates`/`instances`/`constraints` array |
| `Unknown template type: <x>` | Template `type` not `"part"`/`"assembly"` |

## When to use

- **`from()`** for declarative descriptions (generated by another system, config files, pipelines), especially with part templates published as OFB URLs.
- **`assembly.create` + step-by-step** when building template geometry programmatically, or for constraint types `from()` lacks.
- **Mix:** `from()` for the OFB-loaded skeleton, then add unsupported constraints imperatively.

## Working Example (v1)

For v0, omit `version` and prefix types with `CC_` (`CC_FastenedOriginConstraint`, `CC_FastenedConstraint`).

```js
const BASE = 'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/'
const r = await api.v1.assembly.from({
  data: JSON.stringify({
    version: 1,                                // critical, easy to forget
    nameIfRoot: 'NutBoltAsm',
    templates: [
      { ident: 'Bolt_Template', type: 'part', reference: { location: BASE + 'Bolt.ofb', type: 'ofb' } },
      { ident: 'Nut_Template', type: 'part', reference: { location: BASE + 'Nut.ofb', type: 'ofb' } },
    ],
    instances: [
      { ident: 'Bolt_Instance', template: 'Bolt_Template' },
      { ident: 'Nut_Instance', template: 'Nut_Template' },
    ],
    constraints: [
      { type: 'FastenedOriginConstraint',
        mate1: { path: ['Bolt_Instance'], csys: 'WCS_Origin', flip: 'Z', reorient: '0' } },
      { type: 'FastenedConstraint',
        mate1: { path: ['Bolt_Instance'], csys: 'WCS_Nut', flip: 'Z', reorient: '0' },
        mate2: { path: ['Nut_Instance'], csys: 'WCS_Hole-Top', flip: 'Z', reorient: '0' } },
    ],
  }),
  format: 'JSON',
})
// r.result = root ID, maxLevel 31; Bolt at world origin, Nut mounted on the bolt's WCS_Nut
```

### Sub-assembly

NB1's children COG at the root origin; NB2's offset +100 in X.

```js
const BASE = 'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/'
await api.v1.assembly.from({
  data: JSON.stringify({
    version: 1,
    templates: [
      { ident: 'Bolt_T', type: 'part', reference: { location: BASE + 'Bolt.ofb', type: 'ofb' } },
      { ident: 'Nut_T', type: 'part', reference: { location: BASE + 'Nut.ofb', type: 'ofb' } },
      {
        ident: 'NutBolt_Sub', type: 'assembly',
        assembly: {
          templates: [],   // reuses Bolt_T / Nut_T from the parent scope
          instances: [
            { ident: 'Bolt_Inst', template: 'Bolt_T' },
            { ident: 'Nut_Inst', template: 'Nut_T' },
          ],
          constraints: [
            { type: 'FastenedOriginConstraint',
              mate1: { path: ['Bolt_Inst'], csys: 'WCS_Origin', flip: 'Z', reorient: '0' } },
            { type: 'FastenedConstraint',
              mate1: { path: ['Bolt_Inst'], csys: 'WCS_Nut', flip: 'Z', reorient: '0' },
              mate2: { path: ['Nut_Inst'], csys: 'WCS_Hole-Top', flip: 'Z', reorient: '0' } },
          ],
        },
      },
    ],
    instances: [
      { ident: 'NB1', template: 'NutBolt_Sub' },
      { ident: 'NB2', template: 'NutBolt_Sub', transform: '[[100, 0, 0], [1, 0, 0], [0, 1, 0]]' },
    ],
    constraints: [],
  }),
  format: 'JSON',
})
```

## Related

`assembly.create` · `assembly.partTemplate` / `assemblyTemplate` · `assembly.instance` · `assembly.loadProduct` · `assembly.fastened` / `fastenedOrigin` / `cylindrical` / `revolute` / `planar` / `parallel` / `slider` / `linearPattern` · `common.clear` · `common.load`
