# Structure (SCG — Structured ClassCAD Graphic)

The structure tree is the half of an SCG payload that describes the **model**:
every part, assembly, instance, feature, sketch, and the parent-child links
between them. The other half is `graphic` (tessellated meshes, edges, sketches
— see [GRAPHICS.md](GRAPHICS.md)). Together with a small `header` block, the
three form a complete, engine-independent representation of a model.

Source: internal AWV engineering documentation, deep-verified claim-by-claim
against the live server (part, sketch, and AS1-assembly probes). The distilled
subset agents need day-to-day is [DATA.md](DATA.md); this file is the depth.

## The envelope

What the server sends on every Result frame (and what `api.tree()` unwraps):

```ts
type Structure = {
  tree: Record<ObjectID, StructureObject>  // the object tree, keyed by id
  root: ObjectID          // the CURRENT PRODUCT: the CC_Part in a part session,
                          // the CC_AssemblyRoot in an assembly session — NOT AllObjects
  currentProduct: ObjectID   // product being edited (0 when none)
  currentInstance: ObjectID  // instance context in the expanded tree (0 when none)
  testRoot: ObjectID         // engine-internal; ignore
}
```

`AllObjects` (id 1) exists in the tree as the top-most **parent** — every
parent-walk ends there — but `structure.root` never points at it.

## StructureObject

```ts
type StructureObject = {
  id: ObjectID
  class: string             // "CC_Part", "CC_Box", "CC_Sketch", "CC_ProductReference", …
  name: string
  parent: ObjectID | null
  flags: number
  children?: ObjectID[]     // structural sub-objects (NOT the feature list — see below)
  members?: Record<string, {
    value: unknown          // number | string | id | {x,y,z} point | …
    type: 'real' | 'string' | 'id' | 'point' | string
    expression: string      // "" or the bound expression, stored as "ExpressionSet.NAME"
                            // (you WRITE '@expr.NAME' in API calls; the tree shows this form)
    visible: number
  }>

  // Present on some classes:
  solids?: ObjectID[]           // parts: graphic-container ids (see id-spaces below)
  coordinateSystem?: number[][] // [origin, xDir, yDir, zDir] — sketches, work csys,
                                // product references. NOT on default work planes.
  isLocal?: number              // rides along with coordinateSystem
  link?: ObjectID               // CC_ProductReference/…ET only: the referenced product
                                // (identical to members.productId.value)
  expressionSet?: ObjectID      // parts/assemblies: shortcut to the CC_ExpressionSet
  geometrySet?: ObjectID        // shortcut to the CC_GeometrySet
  dimensions?: ObjectID[]       // shortcut list of dimension entities
  instances?: ObjectID[]        // CC_Assembly(Root): DIRECT CC_ProductReference children
  instancesNested?: ObjectID[]  // CC_Assembly(Root): the full expanded instance tree, flat
}
```

## Part anatomy

A part's direct `children` are seven **sets** — features are grandchildren:

```
AllObjects (id 1)
  └─ CC_Part                      ← structure.root in a part session
      ├─ CC_ExpressionSet         ← expressions live in its MEMBERS (key = name), not children
      ├─ CC_DimensionSet
      │   └─ CC_SketchDimensionSet      ← dimension display entities (one per sketch dim)
      ├─ CC_GeometrySet           ← default work geometry: Origin, X/Y/ZAxis, Top/Front/Right
      ├─ CC_ReferenceSet          ← CC_EdgeReference… created when you reference graphic ids
      ├─ CC_SketchSet             ← CC_Sketch nodes
      ├─ CC_EntitySet             ← FEATURES: CC_Box, CC_Extrusion, CC_Subtraction, CC_Chamfer, …
      │   └─ <feature>
      │        └─ CC_Solid        ← each solid is a child of the feature that produced it
      └─ CC_OperationSequence     ← THE HISTORY (ordered references + rollback bar)
```

- **Expressions**: `part.expression({toCreate:[{name:'W',value:30}]})` puts `W`
  into `CC_ExpressionSet.members.W = {value: 30, type: 'real', …}`. The set's
  `children` stay empty. A bound feature param shows
  `members.length.expression === "ExpressionSet.W"`.
- **Work planes** `Top/Front/Right` carry **no** `coordinateSystem` — their
  orientation is implicit (see [SKETCHING.md](SKETCHING.md) plane mappings).
  `CC_WorkCSys` nodes DO carry one.
- To answer *"is feature X under part Y?"* walk `node.parent` upward. Never
  `part.children.includes(featureId)` — features sit two levels down.

## Features and history

`CC_EntitySet.children` is the feature list; each feature's `children` hold the
`CC_Solid`(s) it produced. The **ordered build history** is
`CC_OperationSequence.children`: one `CC_*Reference` node per step, each
pointing at its target via `members.refObj.value`, terminated by the
`CC_RollbackBar`:

```
WorkPointReference:OriginRef → …axis/plane refs… →
SketchReference:SketchRef → OperationReference:ExtrusionRef → RollbackBar
```

```js
// HISTORY WALK (verified live): ordered steps with their target nodes
const t = await api.tree({ refresh: true })
const ops = Object.values(t).find(n => n.class === 'CC_OperationSequence')
const history = ops.children
  .map(id => t[String(id)])
  .filter(r => r.class !== 'CC_RollbackBar')
  .map(r => ({ step: r.name, target: t[String(r.members?.refObj?.value)] }))
```

### Solids, `consumed`, and the three id spaces

Every feature that produces a new solid (boolean, chamfer, extrusion, …) adds a
new `CC_Solid` under itself; the superseded solid stays in the tree with
`members.consumed.value === 1`. The current solid has `consumed === 0`. There
is **no top-level `consumed` field** — it is a member.

Three distinct id spaces meet here (all verified in one session):

| id | lives in | stability |
| --- | --- | --- |
| `CC_Solid` node id (e.g. 89) | tree | session-stable; `container.owner` points at it |
| `part.solids[0]` (e.g. 87) | tree ↔ graphic bridge | the graphic **container id of the engine's latest tessellation** at snapshot time; rotates when a feature creates a solid AND when a recalc re-tessellates |
| `container.id` in a graphic payload (e.g. 87 → 101 after recalc) | graphic | payload-local |

**The stable join between tree and graphic is `container.owner` → `CC_Solid`
node → parent-walk to the feature/part.** `part.solids[0]` equals the container
id only for the tessellation the snapshot describes; after the next recalc the
payload carries a new container id while `owner` stays put.

```js
// FEATURE → ITS GEOMETRY (verified live): join via owner, not container.id
const g = await api.graphic()
const solidNode = Object.values(t).find(n =>
  n.class === 'CC_Solid' && n.members?.consumed?.value === 0)
const container = g.containers.find(c => c.owner === solidNode.id)
const producingFeature = t[String(solidNode.parent)]   // e.g. CC_Chamfer
```

## Sketch anatomy

`sketch.create({ id: partId, planeId })` — `planeId` is MANDATORY for a live
constraint solver (the #1 trap, see [SKETCHING.md](SKETCHING.md); a sketch
created without it accepts constraints/dimensions but never enforces them).

```
CC_SketchSet
  └─ CC_Sketch                    ← carries coordinateSystem [origin,x,y,z]
      ├─ CC_Point / CC_Line / CC_Circle / CC_Arc     ← drawing elements
      ├─ CC_2DFixationConstraint:Auto_Fix            ← auto-generated (genFixation)
      ├─ CC_2DHorizontalConstraint / CC_2DRadiusConstraint / …  ← constraints
      └─ (dimensional constraints, e.g. CC_2DHorizontalDistanceConstraint)

CC_DimensionSet › CC_SketchDimensionSet
  └─ CC_LinearFeatureDimension / CC_RadialFeatureDimension / …
       members.master.value → the driving 2D constraint under the sketch
       members.value        → the dimension value (+ expression when @expr-bound)
```

- Geometry AND constraints are `CC_Sketch.children`; the *display* dimension
  entities live under the part's `CC_DimensionSet › CC_SketchDimensionSet`,
  linked back via `members.master`.
- Element parameters are members: `circle.members.radius.value`,
  `arc.members.bulge`, `line.members.startPt.value = {x,y,z}`.
- `sketch.dimension` returns the **display entity** id; the solver-side
  constraint is its `master`.

```js
// SKETCH CENSUS (verified live): elements vs constraints of a sketch
const sketch = t[String(skId)]
const kids = sketch.children.map(id => t[String(id)])
const elements    = kids.filter(n => !n.class.includes('Constraint'))
const constraints = kids.filter(n => n.class.includes('Constraint'))
```

## Assembly anatomy (verified against AS1 STEP)

Definitions and instances are **separate**. Definitions live in two containers;
the instance tree hangs under the assembly root:

```
AllObjects
  ├─ CC_PartContainer             ← every CC_Part DEFINITION (PLATE, BOLT, NUT, …)
  ├─ CC_AssemblyContainer         ← every CC_Assembly (sub-assembly) DEFINITION
  │   └─ CC_Assembly              ← children: ExpressionSet, ConstraintSet, GeometrySet,
  │                                  + its own CC_ProductReference instances
  └─ CC_AssemblyRoot              ← structure.root; same set children as CC_Assembly
      ├─ CC_ExpressionSet / CC_ConstraintSet / CC_GeometrySet
      ├─ CC_ProductReference      ← one per DIRECT instance placed in the root
      │   └─ CC_ProductReferenceET   ← engine-EXPANDED nested instances (when the
      │        └─ CC_ProductReferenceET …  referenced product is a sub-assembly)
      └─ …
```

There is **no `CC_Instance` class**. An instance is a `CC_ProductReference`
(direct, in a definition) or `CC_ProductReferenceET` (expanded copy of a
nested instance). Both carry:

- `members.productId.value` → the referenced `CC_Part` or `CC_Assembly`
  definition (`link` is the same value as a top-level shortcut),
- `coordinateSystem` — the **local** placement in the parent's frame (an ET
  node repeats the cs of the definition-level reference it expands),
- `members.partName.value` — the instance name (e.g. STEP's `NAUO1`).

`CC_Assembly(Root).instances` lists the direct references;
`instancesNested` flattens the whole expanded tree. `CC_ConstraintSet` holds
assembly constraints (empty for a STEP import, which carries placements only).

### World transforms: accumulate along the reference chain

Transforms are **local per level**. The world matrix of a leaf is the product
of the `coordinateSystem` matrices from the root's direct reference down the
PR/ET chain. Recurse into reference children until `productId` resolves to a
`CC_Part` — that's a placed leaf. This is exactly what
`@classcad/renderer`'s `extractAssemblyInstances` does (image-verified):

```js
// ASSEMBLY WALK (verified end to end): world transform per part instance
const t = await api.tree({ refresh: true })
const rootAsm = Object.values(t).find(n => n.class === 'CC_AssemblyRoot')
const instances = []
function visit(node, parentM) {
  const m = multiply(parentM, matrixFrom(node.coordinateSystem)) // 4×4
  const product = t[String(node.members?.productId?.value)]
  if (product?.class === 'CC_Part') { instances.push({ part: product, world: m }); return }
  for (const cid of node.children ?? []) {
    const c = t[String(cid)]
    if (c?.class === 'CC_ProductReference' || c?.class === 'CC_ProductReferenceET') visit(c, m)
  }
}
for (const cid of rootAsm.children ?? []) {
  const c = t[String(cid)]
  if (c?.class === 'CC_ProductReference' || c?.class === 'CC_ProductReferenceET') visit(c, identity())
}
// Geometry: each instance's meshes = graphic container with
// container.owner === (CC_Solid under instances[i].part), transformed by .world.
// Rendering all containers untransformed = every part at the origin — the
// canonical wrong picture.
```

`coordinateSystem` here is `[origin, xAxis, yAxis, zAxis]` (4×3, row = column
vectors of the rotation + translation). The API also accepts a 3×3 form
`[origin, xDir, yDir]` (zDir derived) when you WRITE placements.

## Bridge `containerId` (buerli apps)

The bridge selection triplet (`bridge.get_selection`/`set_selection`) uses
`part.solids[0]` as `containerId`. Re-derive it immediately before setting a
selection — every solid-creating feature rotates it. A stale containerId
round-trips without error (echoed back), so a successful round-trip proves
nothing; verify visually or with a fresh pick. Imported graphics can carry
negative `graphicId`s; they resolve under the live container.

## Live access

| Surface | Call |
| --- | --- |
| scripts (universal) | `api.tree({refresh: true})` → the `tree` record |
| node session extra | `session.getStructure()` → the full envelope |
| classcad-mcp | `tree({refresh?})`, `find({type?, name?})`, `inspect({id})` |
| buerli apps | store `drawing.structure.tree`, kept live by the client |

WS-protocol details (handshake flags, snapshot vs patch) live in
[common/state-tree.md](common/state-tree.md).
