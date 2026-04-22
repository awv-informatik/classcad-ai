# assembly.partTemplate

Creates a new part and adds it as a template to the PartContainer. The returned ID is a fully functional `CC_Part` — use it as the `id` parameter for all `part.*` API calls to build geometry inside the template.

## Prerequisites

- An assembly must exist (`assembly.create` called first). Without it: `result: null`, error "Assembly building is not initialized!"

## Key Parameters

- `name` (string, optional) — display name. Default: `"Part"`.
  - Multiple unnamed calls auto-increment: "Part", "Part0", "Part1", ...
  - Duplicate names are auto-deduplicated: "Bolt", "Bolt0", "Bolt1", ... — no error.
  - Empty string is allowed (creates a template with blank name).
  - Special characters (spaces, parens, slashes) are preserved verbatim — no sanitization.
  - No `originalName` member (unlike assembly roots).

## Return Value

- `result` — numeric ID of the new `CC_Part` node (first template is typically 22). Returns `null` on failure.
- `maxLevel` — 31 (info) on success.

## Context Switching (Critical)

**`partTemplate()` does NOT switch `currentProduct`.** After calling it, `structure.currentProduct` still points to whatever was current before (usually the assembly root).

Context switches implicitly when you call any `part.*({ id: tplId })` — e.g., `part.box({ id: tplId })` sets `currentProduct` to the template.

**You must call `assembly.setCurrentProduct({ id: asmId })` to return to assembly context** before calling `assembly.instance()` or other assembly-level APIs.

`partTemplate()` can be called from any context — assembly root or another template. It always just creates the template without switching.

## Structure

```
PartContainer (8)
└── CC_Part (22)           ← your template
    ├── ExpressionSet (24)
    ├── GeometrySet (28)
    ├── ... (internal sets)
    └── [features you add]
```

The template is a full `CC_Part` — all `part.*` APIs work: expressions, sketches, work geometry, primitive features, extrusions, booleans, etc.

## Gotchas

- **Context is sticky.** After building in template A, calling `partTemplate()` for template B does NOT switch to B. You must explicitly call `part.*({ id: B })` to work in B.
- **ID ranges.** Each template consumes ~46 IDs for internal nodes. First template starts at ~22, second at ~68, etc.
- **No ident param.** Unlike `assembly.create`, `partTemplate` has no `ident` parameter.

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'MyAsm' })).result

// Create template and build geometry
const tplId = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
await api.v1.part.box({ id: tplId, name: 'Base', length: 80, width: 40, height: 10 })
const wcsId = (await api.v1.part.workCSys({
  id: tplId,
  name: 'AnchorCSys',
  origin: [0, 0, 0],
  xDirection: [1, 0, 0],
  yDirection: [0, 1, 0],
})).result

// Switch back to assembly context before instantiating
await api.v1.assembly.setCurrentProduct({ id: asmId })
const instId = (await api.v1.assembly.instance({
  productId: tplId,
  ownerId: asmId,
  name: 'Bracket_1',
})).result
```

## Related

- `assembly.create` — must be called first to initialize assembly building
- `assembly.getPartTemplate` — find template by name or list all (`{ name }` → single ID, no params → array of all IDs)
- `assembly.assemblyTemplate` — create sub-assembly templates (same pattern, different container)
- `assembly.deleteTemplate` — delete templates by ID array
- `assembly.setCurrentProduct` — switch context between assembly and templates (returns previous product ID)
- `assembly.instance` — instantiate a template in the assembly tree
