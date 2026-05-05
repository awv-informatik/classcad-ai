# Assembly: Template vs Instance Paradigm

The ClassCAD assembly system uses a **template/instance** architecture. Templates define reusable part or sub-assembly geometry. Instances place copies of templates into the assembly with world-space transforms.

## Key Concepts

### Templates

- **Part templates** (`partTemplate`) — full CC_Part nodes in `CC_PartContainer`. Build geometry with `part.*` APIs.
- **Assembly templates** (`assemblyTemplate`) — CC_Assembly nodes in `CC_AssemblyContainer`. Contain instances of other templates.
- Templates are **global** — any template can be instanced in any assembly or sub-assembly.
- Created with `assembly.partTemplate({ name })` or `assembly.assemblyTemplate({ name })`.

### Instances

- **Lightweight references** — not copies of geometry. Each instance is a `CC_ProductReference` node.
- Structure tree members: `productId` (template link), `isDirty`, `localPath`, `ownPart`, `productRefsET`, `_VERSION`. The transform is stored internally — **not visible** in the structure tree member dump.
- Live under `CC_AssemblyRoot` or inside assembly templates.
- Have NO children in the structure tree — geometry comes from the linked template.

### Template vs Expanded Tree IDs

When querying instances from a template (`getInstance({ ownerId: templateId })`), you get CC_ProductReference IDs from the template scope. When querying from an instance of that template (`getInstance({ ownerId: instanceId })`), you get **different** CC_ProductReferenceET IDs from the expanded tree. These are distinct numeric IDs for the same logical instances.

### Structure Tree Layout

```
AllObjects (id=1)
├── CC_PartContainer (id=8)
│   └── CC_Part "Bracket" (id=22)        ← part template (full geometry tree)
├── CC_AssemblyContainer (id=10)
│   └── CC_Assembly "SubAsm" (id=44)     ← assembly template
└── CC_AssemblyRoot (id=12)
    ├── CC_ProductReference (id=105, link=22, coordinateSystem=[[0,0,0],...])  ← instance
    └── CC_ProductReference (id=107, link=22, coordinateSystem=[[80,0,0],...]) ← instance
```

## Propagation Rules (CRITICAL)

Template modifications **DO propagate** to existing instances by default. Instances start as live references.

**However:** calling `calculateMassProperties(instanceId)` **materializes** instances — they get independent geometry copies and stop receiving template updates.

| Operation | Materializes instances? |
|---|---|
| `calculateMassProperties(instanceId)` | **YES** — locks ALL instances of same template |
| `calculateMassProperties(rootAssemblyId)` | No |
| `calculateMassProperties(templateId)` | No |
| `snapshot()` | No |
| `getInstance()` | No |
| `requestVisualisation({ ids: [instId] })` | No |
| No operation (fresh) | No |

**Practical implication:** If you modify a template and want all instances to update, don't call `calculateMassProperties` on individual instances before modifying. If you've already materialized instances, delete and re-create them to get updated geometry.

## ID Usage

- **`productId`** and **`ownerId`** in `assembly.instance()` accept both numeric IDs and string template names.
- **Instance IDs are NOT part IDs.** You cannot call `part.box(instanceId)` — error "not a part id."
- **`setCurrentProduct(instanceId)` works** — switches context to the instance's underlying template.
- **`calculateMassProperties(instanceId)`** returns world-space COG: `template_local_COG + instance_transform_origin`.
- **`calculateMassProperties(rootId)`** returns combined mass properties of all instances.

## Modification Patterns

### Modifying a template (propagates to unmaterialized instances)

```js
await api.v1.assembly.setCurrentProduct({ id: tplId })
await api.v1.part.openFeature({ id: boxFeatureId })
await api.v1.part.updateBox({ id: boxFeatureId, height: 30 })
await api.v1.part.closeFeature({ id: boxFeatureId })
await api.v1.common.recalc({})
await api.v1.assembly.setCurrentProduct({ id: asmId })
// All unmaterialized instances now reflect the change
```

### Getting fresh geometry on materialized instances

```js
// After instances are locked (calculateMassProperties was called on them):
await api.v1.assembly.deleteInstance({ ids: [oldInstId] })
const newInst = (await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId,
  transformation: oldTransform
})).result
// newInst gets the updated template geometry
```

## Delete Behavior

- **Deleting an instance** → template unaffected, other instances unaffected.
- **Deleting a template** → cascades to ALL instances of that template (removed silently).
- Inner part templates survive when an assembly template is deleted.

## Context Switching

- `partTemplate()` does NOT switch `currentProduct`.
- `part.*` calls with a template ID DO switch `currentProduct` to that template (auto).
- `assembly.*` calls with explicit IDs work regardless of `currentProduct`.
- `setCurrentProduct(instanceId)` is valid — enables some `part.*` queries via the instance context.

## Related

- `assembly.create` — creates the root assembly
- `assembly.partTemplate` / `assembly.assemblyTemplate` — create templates
- `assembly.instance` — create instances
- `assembly.deleteTemplate` / `assembly.deleteInstance` — deletion
- `assembly.setCurrentProduct` — context switching
- `assembly.calculateMassProperties` — mass/COG queries
