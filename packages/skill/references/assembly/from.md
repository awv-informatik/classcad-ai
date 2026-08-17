# assembly.from

Creates an assembly from a JSON definition: templates, instances, and constraints. Useful for declarative assembly construction — load part OFBs from URLs, instantiate them, and connect them with mate constraints in a single call.

> ECXML / XML formats are accepted by the parser but **non-functional** — no element types are implemented. Use JSON exclusively.

> Source of truth for the schema: `cclasses/Source/BaseModeling/JsonAssemblyBuilder.cclass` (v0) and `JsonAssemblyBuilder_v1.cclass` (v1). The upstream `assembly_building.md` documents the v1 format but does NOT mention the required `"version": 1` flag — set the flag explicitly when copying that example.

## What It Does

- **Clears the drawing** and creates a new assembly root.
- Loads templates (from URL / base64 / inline geometry).
- Creates instances of those templates.
- Applies 3D constraints between instances.
- Returns the root assembly ID.

## Two schema versions

The top-level `version` field selects the schema. Default is v0.

| | v0 (default, omit `version`) | v1 (`"version": 1`) |
|---|---|---|
| Constraint `type` strings | `CC_FastenedConstraint`, `CC_RevoluteConstraint`, ... | `FastenedConstraint`, `RevoluteConstraint`, ... |
| Inline geometry `type` strings | `CC_Box`, `CC_WorkCSys` | `Box`, `WorkCSys` |
| Everything else (top-level, template, instance, mate fields) | identical | identical |

Both versions dispatch to the same underlying `assembly.*` APIs and produce identical results. Pick v1 when you want the bare names from the upstream doc; pick v0 (default) if you copy class names directly from C++ source.

## Top-level fields

```ts
{
  version?: 1,                  // omit/0 = v0; 1 = v1
  nameIfRoot?: string,          // name for the root assembly (default "AssemblyRoot")
  templates: Template[],
  instances: Instance[],
  constraints: Constraint[],
  userData?: { [key: string]: any },
}
```

- **`nameIfRoot`** is the only top-level naming field. `ident`, `name`, or any other key at the top level is **silently ignored**.

## Template

```ts
{
  ident: string,                // becomes the part/sub-assembly name
  type: "part" | "assembly",
  userData?: object,
  // Plus ONE of the source fields below (per type)
}
```

### `type: "part"` — three source options (priority order)

| Field | Shape | Notes |
|---|---|---|
| `base64` | `<base64-encoded OFB>` | implicit format is OFB |
| `reference` | `{ location: <URL>, type: "ofb" \| "stp" }` | **URL only — no local paths** |
| `geometry` | `Geometry[]` | inline primitives, very limited |

`reference.location` must be an **HTTP/HTTPS URL** — local paths (`/tmp/foo.ofb`, `file:///...`) all fail with `IO_Helper.IoOfbImportStream: Nothing could be found to import!`. Use `base64` if you need to embed local bytes.

Inline `geometry[]` supports only two primitive types (per source enum):
- `{ type: "CC_Box" / "Box", ident, width, length, height }`
- `{ type: "CC_WorkCSys" / "WorkCSys", ident, inverted?: 0|1, transform?: <4x4-matrix-string> }`

For richer geometry, build it in a part with the regular API, save the OFB, host it, and reference its URL.

### `type: "assembly"` — sub-assembly

```ts
{
  ident, type: "assembly",
  // ONE of:
  reference: { location: <URL>, type: "json" },     // fetch JSON from URL
  assembly: { templates, instances, constraints },  // inline (recursive)
}
```

The inline `assembly: {...}` form is recursive — its templates/instances/constraints follow the same schema. **Template lookups are global within a single `from()` call**, so a sub-assembly can reference part templates defined in its parent (and vice-versa) by ident.

## Instance

```ts
{
  ident: string,                // unique within owner
  template: string,             // template ident reference
  transform?: string,           // STRING expression evaluated server-side via OBJ_StrEval
  userData?: object,
}
```

- **`transform` is a STRING, not a JSON array.** The server runs `OBJ_StrEval(instance.transform)`. Provide a string like `"[[50, 30, 10], [1, 0, 0], [0, 1, 0]]"` (origin + xDir + yDir — the same 3-row shape that `assembly.instance({ transformation: ... })` takes).
- The wrong field name `transformation` is **silently ignored**.

## Constraint

```ts
{
  type: <constraint-type-string>,    // see table below
  mate1?: Mate,
  mate2?: Mate,
  instances?: [<ident>],             // only for LinearPattern (untested as of 2026-05-13)
  // Plus all the named-parameter fields of the underlying assembly.<method>:
  //   name, xOffset, yOffset, zOffset, xRotation, yRotation, zRotation,
  //   useCurrentTransform, ... etc.
  userData?: object,
}
```

### Supported constraint types

| `type` (v0) | `type` (v1) | Underlying API |
|---|---|---|
| `CC_FastenedOriginConstraint` | `FastenedOriginConstraint` | `assembly.fastenedOrigin` (uses mate1 only) |
| `CC_FastenedConstraint` | `FastenedConstraint` | `assembly.fastened` |
| `CC_CylindricalConstraint` | `CylindricalConstraint` | `assembly.cylindrical` |
| `CC_RevoluteConstraint` | `RevoluteConstraint` | `assembly.revolute` |
| `CC_PlanarConstraint` | `PlanarConstraint` | `assembly.planar` |
| `CC_ParallelConstraint` | `ParallelConstraint` | `assembly.parallel` |
| `CC_SliderConstraint` | `SliderConstraint` | `assembly.slider` |
| `CC_LinearPatternConstraint` | `LinearPatternConstraint` | `assembly.linearPattern` |

**NOT supported in `from()`** — call the imperative API after `from()` instead:

| Missing type | Workaround |
|---|---|
| Spherical | `assembly.spherical` |
| Gear | `assembly.gear` |
| Group | `assembly.group` |
| CircularPattern | `assembly.circularPattern` |
| Update3DConstraintValue | `assembly.update3DConstraintValue` |

## Mate

```ts
{
  path: [<instance-ident>, ...],   // traversal through assembly hierarchy
  csys: string,                    // work-CSys NAME inside the template
  flip?: "Z" | "-Z" | "X" | "-X" | "Y" | "-Y",
  reorient?: "0" | "90" | "180" | "270",
}
```

- **`path`** is an array of instance idents. For a constraint between two top-level instances, each entry is just one element: `path: ["Bolt_Instance"]`. For a constraint that reaches inside a sub-assembly, list each step: `path: ["NB1", "Bolt_Inst"]`.
- **`csys`** is the **name** (string) of a `CC_WorkCSys` inside the part referenced by `path[0]`. The parser resolves it via `part.getWorkGeometry({ id, name: <csys> })`.
- All other mate-related fields documented on the underlying assembly method (xOffset, yOffset, zOffset, xRotation, yRotation, zRotation, useCurrentTransform, ...) pass through unchanged.

## Working Example — v1 (recommended, matches upstream doc)

```js
const r = await api.v1.assembly.from({
  data: JSON.stringify({
    version: 1,                                // <-- critical, easy to forget
    nameIfRoot: 'NutBoltAsm',
    templates: [
      {
        ident: 'Bolt_Template',
        type: 'part',
        reference: {
          location: 'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/Bolt.ofb',
          type: 'ofb',
        },
      },
      {
        ident: 'Nut_Template',
        type: 'part',
        reference: {
          location: 'https://raw.githubusercontent.com/awv-informatik/classcad-test-data/refs/heads/main/as1/Nut.ofb',
          type: 'ofb',
        },
      },
    ],
    instances: [
      { ident: 'Bolt_Instance', template: 'Bolt_Template' },
      { ident: 'Nut_Instance', template: 'Nut_Template' },
    ],
    constraints: [
      {
        type: 'FastenedOriginConstraint',
        mate1: { path: ['Bolt_Instance'], csys: 'WCS_Origin', flip: 'Z', reorient: '0' },
      },
      {
        type: 'FastenedConstraint',
        mate1: { path: ['Bolt_Instance'], csys: 'WCS_Nut', flip: 'Z', reorient: '0' },
        mate2: { path: ['Nut_Instance'], csys: 'WCS_Hole-Top', flip: 'Z', reorient: '0' },
      },
    ],
  }),
  format: 'JSON',
})
// r.result = root assembly ID
// r.maxLevel = 31 (no errors)
// Bolt is at world origin; Nut is mounted on bolt's WCS_Nut csys.
```

## Working Example — v0 (omit `version`, prepend `CC_`)

```js
await api.v1.assembly.from({
  data: JSON.stringify({
    nameIfRoot: 'NutBoltAsm',
    templates: [ /* same as v1 */ ],
    instances: [ /* same as v1 */ ],
    constraints: [
      {
        type: 'CC_FastenedOriginConstraint',
        mate1: { path: ['Bolt_Instance'], csys: 'WCS_Origin', flip: 'Z', reorient: '0' },
      },
      {
        type: 'CC_FastenedConstraint',
        mate1: { path: ['Bolt_Instance'], csys: 'WCS_Nut', flip: 'Z', reorient: '0' },
        mate2: { path: ['Nut_Instance'], csys: 'WCS_Hole-Top', flip: 'Z', reorient: '0' },
      },
    ],
  }),
  format: 'JSON',
})
```

## Sub-assembly Example

```js
{
  version: 1,
  templates: [
    { ident: 'Bolt_T', type: 'part', reference: { location: BOLT_URL, type: 'ofb' } },
    { ident: 'Nut_T',  type: 'part', reference: { location: NUT_URL,  type: 'ofb' } },
    {
      ident: 'NutBolt_Sub',
      type: 'assembly',
      assembly: {
        templates: [],   // empty — reuses Bolt_T / Nut_T from the parent scope
        instances: [
          { ident: 'Bolt_Inst', template: 'Bolt_T' },
          { ident: 'Nut_Inst',  template: 'Nut_T' },
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
}
```

Numeric verification: NB1's children COG at root origin; NB2's children offset +100 in X. The `transform` propagates to all instances inside the sub-assembly.

## Return value

`r.result` is the **root assembly ID** (numeric). `r.maxLevel = 31` on success. On any error, `maxLevel ≥ 51` and `r.messages[]` contains errors from `jsonAsmBuilder.*` — partial structures may still be created, so always check `maxLevel`.

## Gotchas

- **`from()` clears the drawing.** Same effect as `common.clear() + assembly.create({ name })` at start. Anything you built before is gone.
- **Use `nameIfRoot`, not `ident`, for the root name.** Top-level `ident`/`name` are silently ignored.
- **Constraint type strings need `CC_` prefix in v0.** Set `"version": 1` to use the bare names from the upstream doc. The doc itself doesn't include `version: 1` — adding it is the fix.
- **`instance.transform` is a STRING, not a matrix.** And the field is `transform`, not `transformation`.
- **`reference.location` is URL-only.** Local paths / `file://` URIs / pre-loaded template IDs are all rejected. Use `base64` for embedded OFB bytes.
- **Sub-assemblies need `assembly: {...}` or `reference: {location, type: "json"}`.** Flat `instances`/`constraints` fields on the template body are ignored.
- **Inline geometry is minimal.** Only `Box` / `WorkCSys` (and `CC_`-prefixed equivalents in v0). For anything richer, use an OFB.
- **CC_WorkCSys's `transform` expects a 4x4 matrix**, while `instance.transform` expects a 3-row 3x3 (origin+xDir+yDir). Same field name, different expected shape.
- **`format` is honored for `data` and `url`** but not for `file` — the file-param path infers format from the extension and rejects unknown extensions even when `format` is set.
- **ECXML / XML formats are non-functional.** No element types are implemented; using `<assembly>` was previously observed to hang the worker (avoid).
- **CircularPattern, Spherical, Gear, Group constraints are NOT in `from()`.** Call the imperative APIs after `from()`.
- **LinearPattern via JSON is in the parser but my test failed** (2026-05-13) with "Instance not found: B". Use `assembly.linearPattern` after `from()` until this is reproduced/understood.

## Common Errors

| Error | Cause |
|---|---|
| `Unknown constraint type!` | wrong `type` string (missing `CC_` in v0, or unsupported type) |
| `Instance not found: <ident>` | mate path references an ident that doesn't exist in the current scope (check for typos / scope) |
| `Mate coord system not found: /<inst>/<csys>` | the csys NAME doesn't exist on the referenced template — check the WCS names in the OFB (e.g., `WCS_Origin`, `WCS_Nut`, `WCS_Hole-Top`) |
| `Nothing could be found to import` | `reference.location` is a local path or unreachable URL — use HTTP/HTTPS |
| `It's not possible to create assembly from other formats than json, xml or ecxml` | `file` param has the wrong extension; `format` doesn't override this for the file path |
| `Type error: ... NullMem ... defined as type Array addressed` | a required field (e.g., `templates`, `instances`, `constraints`) is missing — they must be present even if empty |
| `Unknown template type: <x>` | template `type` is not `"part"` or `"assembly"` |

## When to use `from()` vs. step-by-step API

- **Use `from()`** when you have a declarative description of the assembly (e.g., generated from another system, stored as a config file, or built by an automation pipeline). Especially when part templates are already published as OFB URLs.
- **Use `assembly.create` + step-by-step API** when you're building geometry programmatically inside the templates (defining parts inline rather than loading them), or when you need constraint types not supported by `from()` (Spherical, Gear, Group, CircularPattern).
- **Mix them:** start with `from()` for the OFB-loaded skeleton, then add unsupported constraints via the imperative API.

## Related

- `assembly.create` — create an empty assembly root (what `from()` calls internally)
- `assembly.partTemplate` / `assemblyTemplate` — create empty templates (what `from()` calls)
- `assembly.instance` — create instances (`from()` uses this with `isLocal: true`)
- `assembly.loadProduct` — load a single OFB/STP into a template (what `from()` uses internally for URL refs)
- `assembly.fastened` / `fastenedOrigin` / `cylindrical` / `revolute` / `planar` / `parallel` / `slider` / `linearPattern` — the underlying constraint APIs `from()` dispatches to
- `common.clear` — `from()` calls this implicitly at start
- `common.load` — load an entire OFB drawing (different — replaces drawing with a saved file)
