# Structure (SCG — Structured ClassCAD Graphic)

The structure tree is the half of an SCG file/payload that describes the
**model**: every part, assembly, instance, feature, and the parent-child
links between them. The other half is `graphic` (tessellated meshes, edges,
sketches — see [GRAPHICS.md](GRAPHICS.md)). Together with a small `header`
block, the three form a complete, ClassCAD-engine-independent representation
of a model:

```jsonc
{
  "header":    { /* meta — platform, version */ },
  "structure": { /* model — what exists, where */ },
  "graphic":   { /* tessellated geometry — meshes, edges, sketches */ }
}
```

Source: `awv-informatik.atlassian.net/wiki` → CLAS → SCG - Structured ClassCAD Graphic.

## Why structure matters

The graphic alone is geometry **at the global origin** — five solids in an
assembly come back as five mesh containers all centered on (0,0,0). To render
the assembly correctly, the structure tree tells you (a) which graphic
container belongs to which part, (b) how many instances of each part exist,
and (c) what coordinate system / transformation each instance lives under.
Skip the structure and the assembly collapses into one heap of overlapping
geometry.

## Shape

```ts
type Structure = {
  /** The object tree, keyed by ObjectID. Required. */
  tree: Record<ObjectID, StructureObject>

  /** ID of the current root (root part or assembly). Required. */
  root: ObjectID

  /** ID of the current product (root or node in part/assembly container). Optional. */
  currentProduct?: ObjectID

  /** ID of the current instance in the expanded assembly tree. Optional. */
  currentInstance?: ObjectID
}
```

A `StructureObject` is a node in the tree. The empirically observed shape
(see `references/common/state-tree.md` for live snapshots) is roughly:

```ts
type StructureObject = {
  id: ObjectID
  class: string                  // e.g. "CC_Part", "CC_Box", "CC_EntitySet"
  name: string
  parent: ObjectID | null
  flags: number
  children?: ObjectID[]          // direct sub-objects (NOT necessarily features)
  members?: Record<string, {
    value: unknown
    type: 'real' | 'string' | 'array' | string
    expression: string           // parametric link, e.g. "@expr.length"
    visible: number
  }>

  // Domain-specific shortcuts populated for some classes:
  link?: ObjectID                // assembly leaf → ID of the part it instantiates
  solids?: ObjectID[]            // shortcut to graphic.containers used by this object
  coordinateSystem?: Transform   // optional placement transform
  expressionSet?: ObjectID
  geometrySet?: ObjectID
  dimensions?: ObjectID[]
}
```

## Hierarchy you actually see

A part's direct `children` are its **structural sub-objects**, not its
features. Walk through the EntitySet to reach features:

```
AllObjects (root, class=AllObjects, id=1)
  └─ CC_Part
      ├─ CC_ExpressionSet          ← parametric expressions
      ├─ CC_GeometrySet            ← work geometry (planes, axes, points)
      ├─ CC_EntitySet              ← features live here
      │   ├─ CC_Box
      │   ├─ CC_Cylinder
      │   ├─ CC_Extrusion
      │   └─ ...
      ├─ CC_DimensionSet           ← if any
      └─ ...

For an assembly:
AllObjects
  └─ CC_Assembly
      ├─ CC_Instance               ← each instance has a coordinateSystem
      │   └─ link → CC_Part        ← shared definition reused by multiple instances
      ├─ CC_Instance
      └─ CC_AsmConstraintSet
```

When asking *"is feature X under part Y?"* — walk `node.parent` upward until
you reach Y or null. Do **not** rely on `part.children.includes(featureId)`;
features are grandchildren, not children.

## Traversing the tree

Recursive walk, untyped pseudocode:

```ts
type CB = (obj: StructureObject, route: ObjectID[], level: number) => void

function traverse(
  tree: Structure['tree'],
  obj: StructureObject,
  route: ObjectID[],
  level: number,
  cb: CB,
) {
  cb(obj, route, level)
  const newRoute = [...route, obj.id]
  if (Array.isArray(obj.children)) {
    for (const childId of obj.children) {
      traverse(tree, tree[childId], newRoute, level + 1, cb)
    }
  }
}

const root = structure.tree[structure.root]
traverse(structure.tree, root, [], 0, (obj, route, level) => {
  console.log(`${'  '.repeat(level)}${obj.class} id=${obj.id} name="${obj.name}"`)
})
```

## Transformations in assemblies (the load-bearing part)

Each `CC_Instance` may carry a `coordinateSystem` transform. Each part may be
referenced from multiple instances. To render correctly:

1. Walk the tree from `root`.
2. Accumulate the path of `coordinateSystem` transforms along the way.
3. When you hit a leaf node with a `link` property, that's an assembly leaf
   pointing to a part. Resolve `tree[node.link]` for the part definition.
4. The part's `solids` array lists IDs into `graphic.containers`. For each
   container, **copy** the graphic and apply the accumulated transform stack.

```ts
const handleNode = (node: StructureObject, route: ObjectID[]) => {
  if (!node.link) return
  const part = tree[node.link]
  const fullRoute = [...route, node.id]
  const transforms = fullRoute
    .map(id => tree[id].coordinateSystem)
    .filter(Boolean)

  for (const containerId of part.solids ?? []) {
    const container = graphic.containers.find(c => c.id === containerId)
    if (!container) throw new Error(`Missing graphic container ${containerId}`)
    // In a real consumer: deep-copy `container`, then apply each transform in
    // `transforms` in order, then add to the scene.
  }
}

traverse(tree, tree[root], [], 0, handleNode)
```

Skip these transforms and an AS1-style assembly renders as five overlapping
parts at the origin — the canonical "wrong" picture.

## Live access from agents

The harness ([scripts/client.mjs](../../../scripts/client.mjs)) caches the
latest structure on every Result frame. The MCP exposes it via:

| Tool                      | Purpose                                           |
| ------------------------- | ------------------------------------------------- |
| `tree({refresh?})`        | Full envelope `{root, currentProduct, ..., tree}` |
| `find({type?, name?})`    | Filter by `class` and/or name substring           |
| `inspect({id})`           | One node + parent chain                           |

Server protocol notes (handshake flags, snapshot vs patch behavior) live in
[common/state-tree.md](common/state-tree.md). What's there is the WS protocol's
runtime view; this file is the SCG file-format spec.
