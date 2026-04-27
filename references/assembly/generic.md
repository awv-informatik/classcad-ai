# Template vs Instance Paradigm

The ClassCAD assembly system uses a template/instance architecture. **Templates** define geometry and features (stored in PartContainer or AssemblyContainer). **Instances** are positioned references to templates (stored in the assembly tree). All instances of a template share the same geometry — there is no per-instance geometry override.

## Core Concepts

### Templates
- **Part templates** (`CC_Part` in `PartContainer`) — full parametric parts with features, sketches, expressions
- **Assembly templates** (`CC_Assembly` in `AssemblyContainer`) — containers for sub-instances, constraints, expressions
- Created via `assembly.partTemplate` / `assembly.assemblyTemplate` / `assembly.convertToTemplate`
- Templates are the ONLY place geometry lives. All `part.*` feature APIs require a template ID, not an instance ID.

### Instances
- **`CC_ProductReference`** — an instance node in the assembly tree
- Each has a `productId` member (type: "id") pointing to its template
- Instances are leaf nodes (for part instances) or have children (for assembly instances)
- Created via `assembly.instance({ productId, ownerId })`

### Expanded Tree (Assembly Instances)
When an assembly template is instanced, its sub-instances are mirrored as **`CC_ProductReferenceET`** nodes under the assembly instance. These form the "expanded tree."

- `CC_ProductReferenceET` has `productRef` → points back to the template's `CC_ProductReference`
- `CC_ProductReference` (in template) has `productRefsET` → array of all its expanded-tree copies

## What's Shared vs Per-Instance

| Property | Scope | Notes |
|---|---|---|
| Geometry (features, sketches, solids) | **Template** | All instances share. Cannot add geometry to an instance. |
| Appearance (color, transparency) | **Template** | `setAppearance` rejects instance IDs ("must be an operation id") |
| Position/Orientation | **Per-instance** | Via `transformation` param on `instance()` |
| Name | **Per-instance** | `setObjectName` works on instance IDs |
| User data | **Per-instance** | `setUserData/getUserData` work independently per instance |
| Mass properties | **Per-instance** | `calculateMassProperties` includes transformation offset |

## Bidirectional Sync (Assembly Instances)

**Adding or deleting** a sub-instance through an assembly instance (expanded tree) propagates to the template AND all other instances of that template. This is the API doc's claim: "If the owner is an instance in the expanded tree, its template in the assembly container will also be updated."

This is not one-way — it's full bidirectional sync:
- Add to instance → template updated → all other instances updated
- Delete from instance → template updated → all other instances updated
- Add to template → all instances updated
- Delete from template → all instances updated

## Context Switching

`setCurrentProduct({ id })` controls which product is "active" for API calls:

- Pass **assembly root ID** → assembly context (for creating instances, constraints)
- Pass **template ID** → template context (for adding features, sketches)
- Pass **instance ID** → switches to the instance's **template** (resolves `productId` automatically)

`setCurrentProduct` returns the previous product ID. Use it to switch back after editing a template.

## Gotchas

- **Part APIs reject instance IDs.** `part.box({ id: instanceId })` errors with "not a part id." You must use the template ID.
- **`setAppearance` does not work per-instance.** Color is template-level only.
- **Self-referencing is blocked.** `instance({ productId: asmTpl, ownerId: asmTpl })` errors: "An assembly can not be placed into itself."
- **Duplicate instance names are allowed.** No error, no dedup. But `getInstance({ name })` returns only the first match.
- **Auto-naming uses template name.** An instance without a `name` param gets the template's name (e.g., "MyPart", "MyPart0", "MyPart1").
- **`getInstance` on part template ID fails.** It only accepts assembly IDs or instance IDs as `ownerId`. Part templates are not assembly-type nodes.
- **`getInstance` not-found returns empty array**, not null, and maxLevel 31 (not an error).
- **Empty template instances work.** You can instance a template with no geometry — no error.
- **Save/load preserves everything.** IDs, template references, structure — all survive OFB serialization exactly.

## Structure Tree Reference

```
AllObjects (1)
├── PartContainer (8)           ← CC_PartContainer
│   ├── CC_Part (22)            ← part template (full feature tree)
│   └── CC_Part (68)            ← another template
├── AssemblyContainer (10)      ← CC_AssemblyContainer
│   └── CC_Assembly (113)       ← assembly template
│       ├── ExpressionSet
│       ├── ConstraintSet
│       ├── GeometrySet
│       ├── CC_ProductReference ← template-level instance (productRefsET: [expanded copies])
│       └── CC_ProductReference ← another
└── AssemblyRoot (12)           ← CC_AssemblyRoot
    ├── ExpressionSet
    ├── ConstraintSet
    ├── GeometrySet
    ├── IdentToIdMap            ← only if ident params used
    ├── CC_ProductReference     ← part instance (leaf, productId → template)
    └── CC_ProductReference     ← assembly instance (has children)
        ├── CC_ProductReferenceET ← expanded tree (productRef → template's instance)
        ├── CC_ProductReferenceET
        └── CC_ProductReferenceET
```

## Instance Members

| Member | Type | Description |
|---|---|---|
| `productId` | id | Points to the template (CC_Part or CC_Assembly) |
| `isDirty` | real | 1 = needs recalculation |
| `ownPart` | real | 0 = shares template geometry (always 0 in practice) |
| `partName` | string | Empty for in-drawing templates, used for file-based references |
| `localPath` | string | Empty for in-drawing templates, used for file-based references |
| `productRefsET` | array | List of expanded-tree copy IDs (only on CC_ProductReference in templates) |

CC_ProductReferenceET has the same members except: no `productRefsET`, but has `productRef` (id → parent CC_ProductReference).

## Working Example

```js
// Full template/instance workflow
const asmId = (await api.v1.assembly.create({ name: 'Machine' })).result

// Create part template with geometry
const boltTpl = (await api.v1.assembly.partTemplate({ name: 'Bolt' })).result
await api.v1.part.cylinder({ id: boltTpl, name: 'Shaft', height: 30, diameter: 8 })
const wcs = (await api.v1.part.workCSys({
  id: boltTpl, name: 'WCS', origin: [0, 0, 0],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

// Switch to assembly context before creating instances
await api.v1.assembly.setCurrentProduct({ id: asmId })

// Create instances (single or batch)
const inst1 = (await api.v1.assembly.instance({
  productId: boltTpl, ownerId: asmId, name: 'Bolt_1',
})).result

const inst2 = (await api.v1.assembly.instance({
  productId: boltTpl, ownerId: asmId, name: 'Bolt_2',
  transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]],
})).result

// Edit template → all instances update
await api.v1.assembly.setCurrentProduct({ id: boltTpl })
await api.v1.part.sphere({ id: boltTpl, name: 'Head', radius: 6, translation: [0, 0, 30] })
await api.v1.assembly.setCurrentProduct({ id: asmId })
// Both Bolt_1 and Bolt_2 now show shaft + head

// Per-instance metadata
await api.v1.common.setUserData({ id: inst1, key: 'torque', value: '15Nm' })
await api.v1.common.setUserData({ id: inst2, key: 'torque', value: '20Nm' })
```

## Related

- `assembly.instance` — create instances
- `assembly.getInstance` — find instances by name or list all
- `assembly.deleteInstance` — delete instances (cascade from template: use `deleteTemplate`)
- `assembly.setCurrentProduct` — switch between assembly and template contexts
- `assembly.partTemplate` / `assembly.assemblyTemplate` — create templates
- `assembly.calculateMassProperties` — works on assemblies, instances, and templates
