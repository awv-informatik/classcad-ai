# Structure — the model tree

The structure tree describes the **model**: every part, assembly, instance,
feature, sketch, and the parent-child links between them. Its geometric
counterpart is the graphic payload (tessellated meshes and edges — see
[GRAPHICS.md](GRAPHICS.md)). The distilled subset agents need day-to-day is
[DATA.md](DATA.md); this file is the depth.

## The envelope

What the engine sends (and what `api.tree()` unwraps to its `tree`):

```ts
type Structure = {
  tree: Record<ObjectID, StructureObject>  // the object tree, keyed by id
  root: ObjectID             // the ROOT product: the CC_Part in a part session, the
                             // CC_AssemblyRoot in an assembly session (also after a STEP
                             // load); 1 (AllObjects) while the drawing holds no product
  currentProduct: ObjectID   // the product being edited: the root, or the template the last
                             // call worked on (part.box on a template → that CC_Part); 0 when empty
  currentInstance: ObjectID  // 0 in a part session; in an assembly the root id, or the
                             // instance set by assembly.setCurrentInstance
  testRoot: ObjectID         // always 0
}
```

`AllObjects` (id 1) is the top-most **parent** — every parent-walk ends there.
Its `children` also list ids that are not in the tree (a part session: one, an
assembly: two) — skip ids the tree does not hold.

### When it arrives

- **Inside a script** (`run_script` of the MCP and buerli-ai) emission is off:
  every call's `r.structure` and `r.graphic` are `null`. Read the model with
  `await api.tree({ refresh })` — one pull after a change, the cache otherwise.
- **Outside a script** (the training harness, an app's own connection) every
  Result carries the structure, read-only calls included.
- **Size**: an empty drawing is 1 node; `part.create` makes it 24; a primitive
  feature adds 3 (the feature, its `CC_OperationReference`, its `CC_Solid`),
  `deleteFeature` removes them, `common.clear` goes back to 1. A small part is
  ~10 KB of JSON — filter before you print it.

## Classes form a hierarchy

`class` strings belong to an inheritance tree (`ScgClassInheritance` in
`@classcad/api-js`: every class lists its flattened `superClasses`; buerli's
`ccUtils.base.isA` checks against it). The load-bearing relations:

- `CC_Part` and `CC_Assembly` both derive from `CC_Product` — "give me all
  products" matches parts AND assemblies.
- `CC_AssemblyRoot` derives from `CC_Assembly`.
- `CC_ProductReference` and `CC_ProductReferenceET` both derive from
  `I_ProductReference` — one predicate catches every instance node.

Exact string comparison (`n.class === 'CC_Part'`) is fine for leaf classes;
just remember a `CC_AssemblyRoot` will NOT match `=== 'CC_Assembly'` — test
both (or use buerli's `isA` where available).

## StructureObject

```ts
type StructureObject = {
  id: ObjectID
  class: string             // "CC_Part", "CC_Box", "CC_Sketch", "CC_ProductReference", …
  name: string
  parent: ObjectID | null
  flags: number             // 0 on AllObjects and products, 4096 on sets and work geometry
  children?: ObjectID[]     // structural sub-objects (NOT the feature list — see below);
                            // the key is ABSENT when there are none, not []
  members?: Record<string, Member>

  // Present on some classes:
  solids?: ObjectID[]           // CC_Part: the graphic container id of each unconsumed body
  geometryIdList?: ObjectID[]   // CC_Solid, and sketch curves a feature used: their container id
  coordinateSystem?: number[][] // [origin, xAxis, yAxis, zAxis] — CC_Sketch, CC_WorkCSys, product
                                // references, CC_DimensionSet, CC_SketchDimensionSet.
                                // NOT on work planes, axes or points
  isLocal?: number              // rides along with coordinateSystem
  link?: ObjectID               // a reference to a CC_PART only: that part (= members.productId.value);
                                // ABSENT on references to a CC_Assembly
  expressionSet?: ObjectID      // CC_Part only: its CC_ExpressionSet
  geometrySet?: ObjectID        // CC_Part only: its CC_GeometrySet
  dimensions?: ObjectID[]       // CC_Part: its display-dimension entities; CC_Assembly(Root): []
  instances?: ObjectID[]        // CC_Assembly(Root): DIRECT CC_ProductReference children
  instancesNested?: ObjectID[]  // CC_Assembly(Root): every reference below, depth-first pre-order
}

type Member =
  | { value: unknown; type: 'real' | 'string' | 'id' | 'point'; expression: string; visible: number }
  | { members: Member[]; type: 'array'; expression: string; visible: number } // no `value`
```

`expression` is `""`, a bound expression stored as `"ExpressionSet.NAME"` (you
WRITE `'@expr.NAME'` in API calls; the tree shows this form), or an engine
formula (`dimPt: 'GetSE(…)'`). Skip `_VERSION` members.

## Part anatomy

A part's direct `children` are seven **sets**, in this order — features are
grandchildren:

```
AllObjects (id 1)
  └─ CC_Part                      ← structure.root in a part session
      ├─ CC_ExpressionSet         ← expressions live in its MEMBERS (key = name); no children
      ├─ CC_DimensionSet
      │   └─ CC_SketchDimensionSet      ← one per sketch, named after it (members.owner → the
      │                                    sketch): that sketch's display dimensions
      ├─ CC_GeometrySet           ← Origin (CC_WorkPoint), X/Y/ZAxis (CC_WorkAxis),
      │                              Top/Front/Right (CC_WorkPlane); later also CC_WorkCSys
      │                              and the CC_SketchRegion an extrusion from curves creates
      ├─ CC_ReferenceSet          ← CC_EdgeReference per edge a feature references
      │                              (members.edgeId = the graphic edge id)
      ├─ CC_SketchSet             ← CC_Sketch nodes
      ├─ CC_EntitySet             ← FEATURES: CC_Box, CC_Extrusion, CC_Subtraction, CC_Chamfer,
      │   │                          CC_ConstantRadiusFillet, CC_Import (STEP), …
      │   └─ <feature>
      │        └─ CC_Solid        ← each solid is a child of the feature that produced it
      └─ CC_OperationSequence     ← THE HISTORY (ordered references + rollback bar)
```

- **Expressions**: `part.expression({toCreate:[{name:'W',value:30}]})` puts `W`
  into `CC_ExpressionSet.members.W = {value: 30, type: 'real', …}`. A bound
  feature parameter shows `members.length.expression === "ExpressionSet.W"`
  (box `length`, extrusion `limit2`, …).
- **Work planes, axes and points** carry **no** `coordinateSystem` — their
  orientation is implicit (see [constrained-sketching](../recipes/constrained-sketching.md) plane mappings).
  `CC_WorkCSys` nodes DO carry one.
- To answer *"is feature X under part Y?"* walk `node.parent` upward. Never
  `part.children.includes(featureId)` — features sit two levels down.

## Features and history

`CC_EntitySet.children` is the feature list, in creation order; each feature's
`children` hold the `CC_Solid`(s) it produced. The **ordered build history** is
`CC_OperationSequence.children`: one reference node per step
(`CC_WorkPointReference`, `CC_WorkAxisReference`, `CC_WorkPlaneReference`,
`CC_SketchReference`, `CC_OperationReference`, `CC_WorkCSysReference`, …), each
pointing at its target via `members.refObj.value`, terminated by the
`CC_RollbackBar`. Step names only loosely follow the target (sketch `S` →
`SRef`, csys `WC` → `WorkCSysRef`) — resolve through `refObj`, not the name.

```js
// HISTORY WALK: ordered steps with their target nodes
const t = await api.tree({ refresh: true })
const ops = Object.values(t).find(n => n.class === 'CC_OperationSequence')
const history = ops.children
  .map(id => t[String(id)])
  .filter(r => r.class !== 'CC_RollbackBar')
  .map(r => ({ step: r.name, target: t[String(r.members?.refObj?.value)] }))
```

### Solids, `consumed`, and the id spaces

Every feature that produces a new solid (extrusion, boolean, chamfer, fillet, …)
adds a new `CC_Solid` under itself; the superseded solids stay in the tree with
`members.consumed.value === 1` — a boolean consumes its target AND its tools.
The live solid has `consumed === 0`. There is **no top-level `consumed` field**
— it is a member. (Inside an entity injection a `solid.*` boolean removes the
tool's `CC_Solid` from the tree instead.)

| id | lives in | stability |
| --- | --- | --- |
| `CC_Solid` node id | tree; `container.owner` points at it | session-stable |
| container id (`part.solids`, `CC_Solid.geometryIdList`, `container.id`) | graphic payload, mirrored on the tree | new on every re-tessellation: a feature that builds the body, `part.updateExpression`, a recalc |
| face / edge / vertex id (`mesh.id`, `edge.id` — the brep ids `getGeometryIds` returns) | graphic payload | a body-building feature keeps the ids of the faces and edges it does not touch and gives new ids to what it creates or cuts; a recalc renumbers all; a work plane changes none |

**The stable join between tree and graphic is `container.owner` → `CC_Solid`
node → parent-walk to the feature/part.** The payload also keeps the
containers of CONSUMED solids — with the same face and edge ids as the live
body wherever the feature left them alone — so filter by live owners:

```js
// FEATURE → ITS GEOMETRY: join via owner, live bodies only
const g = await api.graphic()
const live = Object.values(t).filter(n => n.class === 'CC_Solid' && n.members?.consumed?.value === 0)
const bodies = live.map(solid => ({
  solid,
  container: g.containers.find(c => c.owner === solid.id && c.meshes), // the WASM engine also sends an empty one per solid
  producingFeature: t[String(solid.parent)], // e.g. CC_Chamfer
}))
// same set: api.inspect.currentSolids(await api.inspect.capture())
```

## Sketch anatomy

`sketch.create({ id: partId, planeId })` — `planeId` is MANDATORY for a live
constraint solver (the #1 trap, see [constrained-sketching](../recipes/constrained-sketching.md)). A sketch
created without it stores constraints but never solves them:
`sketch.getGlobalState` reports `UNDEFINED`, and a dimension with a value fails
(maxLevel 51).

```
CC_SketchSet
  └─ CC_Sketch                    ← coordinateSystem [origin,x,y,z]; members.planeReference → the plane
      ├─ CC_Line / CC_Circle / CC_Arc / CC_Point      ← drawing elements; their points are children:
      │                                                  line [startPoint, endPoint], circle [center],
      │                                                  arc [endPoint, startPoint, center]
      ├─ CC_2DFixationConstraint:Auto_Fix, Auto_H, Auto_V, Auto_Coinc…   ← auto-generated
      ├─ CC_2DHorizontalConstraint / CC_2DCoincidentConstraint / …       ← your constraints
      ├─ CC_2DHorizontalDistanceConstraint / CC_2DRadiusConstraint / …   ← dimensional constraints
      └─ CC_RigidSet

CC_DimensionSet › CC_SketchDimensionSet (one per sketch)
  └─ CC_LinearFeatureDimension / CC_RadialFeatureDimension / …   ← display entities
       members.master.value    → the dimensional constraint under the sketch
       members.paramName.value → the bound expression's name ('' when unbound)
```

- Geometry AND constraints are `CC_Sketch.children`; end points and centers
  are children of their curve (`CC_Point`, `members.pos.value = {x,y,z}`).
- Element members: a line has `members.direction` (end − start) and no
  start/end member — read its child points; a circle `members.radius`; an arc
  `members.bulge` and `members.radius`; all carry `isConstruction` and `lgsState`.
- `sketch.dimension` returns the **display entity** id; the solver-side
  constraint is its `master`, and the master holds the value and its binding:
  `master.members.value = {value: 40, expression: 'ExpressionSet.W'}`. A linear
  display entity has no `value` member; a radial one has `value` (its
  `expression` stays `''`).
- Sketch curves get a graphic container (`type` 2, owner = the curve, mirrored
  in the curve's `geometryIdList`) once a feature has used the sketch; an
  unused sketch has none.

```js
// SKETCH CENSUS: elements vs constraints of a sketch
const sketch = t[String(skId)]
const kids = sketch.children.map(id => t[String(id)])
const elements    = kids.filter(n => !n.class.includes('Constraint') && n.class !== 'CC_RigidSet')
const constraints = kids.filter(n => n.class.includes('Constraint'))
```

`sketch.getObjectsLists({ id })` returns the same census as id lists.

## Assembly anatomy

Definitions and instances are **separate**. Definitions live in two containers;
the instance tree hangs under the assembly root:

```
AllObjects
  ├─ CC_PartContainer             ← every CC_Part DEFINITION (PLATE, BOLT, NUT, …)
  ├─ CC_AssemblyContainer         ← every CC_Assembly (sub-assembly) DEFINITION
  │   └─ CC_Assembly              ← children: ExpressionSet, ConstraintSet, GeometrySet
  │                                  (→ CC_WorkCSys BaseWCSys) + its own CC_ProductReference instances
  └─ CC_AssemblyRoot              ← structure.root; the same set children, plus a
      │                              CC_3DConstraintSolver once a constraint exists
      ├─ CC_ExpressionSet / CC_ConstraintSet / CC_GeometrySet
      ├─ CC_ProductReference      ← one per DIRECT instance placed in the root
      │   └─ CC_ProductReferenceET   ← engine-EXPANDED copies of a sub-assembly's instances
      │        └─ CC_ProductReferenceET …   (one level per nesting level)
      └─ …
```

There is **no `CC_Instance` class** — neither in live trees nor in the
`@classcad/api-js` class registry. An instance is a `CC_ProductReference`
(direct, in a definition) or `CC_ProductReferenceET` (expanded copy of a
nested instance). Both carry:

- `members.productId.value` → the referenced `CC_Part` or `CC_Assembly`
  definition (`assembly.getProduct` returns the same id). `link` repeats it
  ONLY when the product is a `CC_Part` — so `link` marks a part instance (its
  geometry is `tree[link].solids`), not every instance. A reference to a
  sub-assembly has no `link`; under the root it carries its ET expansion as
  `children` (a definition-level reference to a sub-assembly has none).
- `coordinateSystem` — the **local** placement in the parent's frame. An ET
  repeats the cs of the definition-level reference it expands
  (`members.productRef.value` → that reference, which lists its ETs in
  `members.productRefsET`).
- `name` — the instance name. `members.partName.value` repeats it only for
  STEP imports (`NAUO1`, …); it is `''` on API-built instances.

`CC_Assembly(Root).instances` lists the direct references;
`instancesNested` lists every reference below, depth-first pre-order.
`CC_ConstraintSet` holds the assembly constraints (`CC_FastenedConstraint`, …;
a STEP import has none). The graphic payload holds ONE container per template
body, in template-local coordinates — the placements come from the tree.

### World transforms: accumulate along the reference chain

Transforms are **local per level**. The world matrix of a leaf is the product
of the `coordinateSystem` matrices from the root's direct reference down the
PR/ET chain. Recurse into reference children until the referenced product is a
`CC_Part` — that's a placed leaf. `@classcad/renderer`'s
`extractAssemblyInstances` implements this walk top-down; buerli's
`api.structure.calculateGlobalTransformation(id)` computes the same matrix
bottom-up (premultiplying every `coordinateSystem` on the parent walk from the
instance to `root`). The walk below reproduces the placements of
`assembly.calculateMassProperties` per leaf:

```js
// ASSEMBLY WALK: world transform per part instance
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

`coordinateSystem` here is `[origin, xAxis, yAxis, zAxis]`: four rows, each a
vector in the parent frame — the axes are the COLUMNS of the rotation
(`matrixFrom` puts x, y, z, origin into the columns of a 4×4). When you WRITE
placements: `assembly.instance` takes `[origin, xDir, yDir]` (zDir derived) or
a 4×4; `transformInstance` takes only a 4×4; `transformInstanceTo` takes only
`[origin, xDir, yDir]`.

## Selection ids (apps in the session)

What a user selected in an app that shares the session (`get_selection` of
classcad-mcp) names a face, edge or vertex like this:

| field | is | after a feature rebuilds the body |
| --- | --- | --- |
| `graphicId` | the element: the id API calls take for a face, an edge or a vertex | kept for faces and edges the feature did not touch; a recalc renumbers all |
| `containerId` | the graphic container the pick was made in | the selection keeps the old one — now a consumed body's |
| `objectId` | the `CC_Solid` that owns that container (`container.owner`) | likewise the old, consumed solid |
| `prodRefId` | the instance in an assembly; the part itself in a part session | — |

Each item also carries `kind` (face | edge | vertex | object), the surface or
curve `type` (plane, cylinder, line, …) and `object` (`{class, name}`).

`set_selection` after a rebuild: pass the live `containerId` (the part's
`solids`) with the `graphicId`. Without it the app takes the first container
that holds the id — after a rebuild that can be the consumed body's, and the
selection then reports the consumed `CC_Solid`. Read a selection right before
you use it. Imported graphics can carry negative `graphicId`s; they resolve
under the live container.

## Live access

| Surface | Call |
| --- | --- |
| scripts (universal) | `api.tree({refresh: true})` → the `tree` record; `api.inspect.capture()` + `currentSolids(capture)` → the live `CC_Solid` ids |
| node session extra | `session.getStructure()` → the full envelope |
| classcad-mcp | `tree({refresh?})` → `{root, currentProduct, currentInstance, nodeCount, nodes}` (slim nodes); `find({type?, name?})`; `inspect({id})` (full node + parent chain) |
| buerli apps | store `drawing.structure.tree`, kept live by the client; `api.structure.calculateGlobalTransformation(id)` (world matrix), `calculateProductBounds(id)`, `collectProducts(rootId)` |
