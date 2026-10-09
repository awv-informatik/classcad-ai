# Assembly: Template vs Instance Paradigm

ClassCAD assemblies use a **template/instance** architecture: templates define reusable part or sub-assembly geometry; instances place them with world-space transforms.

## Key Concepts

### Templates

- **Part templates** (`assembly.partTemplate({ name })`) — full CC_Part nodes in `CC_PartContainer`; build geometry with `part.*`.
- **Assembly templates** (`assembly.assemblyTemplate({ name })`) — CC_Assembly nodes in `CC_AssemblyContainer`, containing instances of other templates.
- Templates are **global** — any template can be instanced in any assembly or sub-assembly.

### Instances

- **Lightweight references**, not geometry copies: `CC_ProductReference` nodes under `CC_AssemblyRoot` or inside assembly templates. A root instance of an assembly template has its expanded `CC_ProductReferenceET` nodes as children; part instances have none.
- Tree members: `productId` (template link — `assembly.getProduct({ instanceId })` returns it; the node field `link` exists only when the product is a part), `isDirty`, `localPath`, `ownPart`, `productRefsET`, `_VERSION`. Placement is a node field, not a member: `(await api.tree())[instanceId].coordinateSystem` → `[origin, xDir, yDir, zDir]` in assembly coordinates. Read it to verify where constraints put an instance.
- Querying `getInstance({ ownerId: templateId })` returns template-scope CC_ProductReference IDs; `getInstance({ ownerId: instanceId })` returns **different** expanded-tree CC_ProductReferenceET IDs for the same logical instances.

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

Template modifications **propagate** to existing instances by default. **But** `calculateMassProperties(instanceId)` **materializes** instances: they get independent geometry copies and stop receiving template updates.

| Operation | Materializes? |
|---|---|
| `calculateMassProperties(instanceId)` | **YES** — ALL instances of that template |
| `calculateMassProperties(rootAssemblyId)` / `(templateId)` | No |
| `common.save`, `getInstance()`, `requestVisualisation({ ids: [instId] })`, fresh (no operation) | No |

Don't measure individual instances before modifying a template. Already materialized instances must be deleted and re-created (`deleteInstance`, then `instance` with the same transformation) to get the updated geometry.

Modifying a template (reaches all unmaterialized instances):

```js
await api.v1.assembly.setCurrentProduct({ id: tplId })
await api.v1.part.openFeature({ id: boxFeatureId })
await api.v1.part.updateBox({ id: boxFeatureId, height: 30 })
await api.v1.part.closeFeature({ id: boxFeatureId })
await api.v1.common.recalc({})
await api.v1.assembly.setCurrentProduct({ id: asmId })
```

## Constraint Solving

The solver places instances. It runs when a constraint is created or updated (`fastened`, `updateFastened`, …) and at the end of `part.updateExpression` for every assembly containing the updated part. `common.recalc()` regenerates part geometry but does **not** run the solver — instances mounted on a csys that moved (e.g. driven by a changed dimension) keep their previous placement.

To re-solve: call `part.updateExpression` on an instanced part (re-assigning an existing expression to its current formula is enough), or re-apply a value on an affected constraint (e.g. `updateFastened({ id, zOffset: 0 })`).

## Parameters and Expressions

**Assemblies do not host expressions — only parts do.** `part.expression` accepts part and part-template IDs; assembly IDs are rejected (`wrong id type ... ["part"]`). Shared parameters live in a **parameter part** — a part template holding only expressions, read by other parts via an object path:

```js
const Params = (await api.v1.assembly.partTemplate({ name: 'Params' })).result
await api.v1.part.expression({ id: Params, toCreate: [{ name: 'W', value: 40 }] })
await api.v1.part.expression({ id: Shell, toCreate: [{ name: 'H', value: 'Params.ExpressionSet.W' }] })
```

Propagating a change needs a refresh of each consuming part — full pattern, reasons and caveats: `recipes/assembly-parameters`.

## IDs and Context

- `productId` / `ownerId` in `assembly.instance()` accept numeric IDs and template names.
- **Instance IDs are not part IDs:** `part.box(instanceId)` → "not a part id."
- `calculateMassProperties(instanceId)` → world COG = `template_local_COG + instance_transform_origin`; `(rootId)` → combined properties of all instances.
- `partTemplate()` does NOT switch `currentProduct`; `part.*` calls with a template ID DO (automatically); `assembly.*` calls with explicit IDs work regardless.
- `setCurrentProduct(instanceId)` is valid — switches to the underlying template, enabling some `part.*` queries via the instance context.

## Delete Behavior

- Deleting an instance → template and other instances unaffected.
- Deleting a template → silently cascades to ALL its instances; inner part templates survive deleting an assembly template.

## Related

`assembly.create` · `assembly.partTemplate` / `assembly.assemblyTemplate` · `assembly.instance` · `assembly.deleteTemplate` / `assembly.deleteInstance` · `assembly.setCurrentProduct` · `assembly.calculateMassProperties` · `assembly.fastened` · `recipes/assembly-parameters`
