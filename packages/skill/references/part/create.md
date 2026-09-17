# part.create

Creates a new part and returns its ID. Every modeling workflow starts here; expects an empty drawing (`common.clear` first if anything exists).

## Key Parameters

- `name` — optional string, default `"Part"` (name in the structure tree).
- No other parameters; unknown params are silently ignored. `{}` or no argument works.

## Return Value

- `result`: part id (number) — always `4` in a clean session (don't hardcode it, but expect it)
- `maxLevel: 31`, `messages: []`

## Structure Tree After Creation

A new part creates **24 nodes**:

```
AllObjects (1)
└── CC_Part "YourName" (4)          ← partId
    ├── ExpressionSet (6)
    ├── DimensionSet (8)
    ├── GeometrySet (10)
    │   ├── Origin (22)             ← CC_WorkPoint
    │   ├── XAxis (26), YAxis (30), ZAxis (34)   ← CC_WorkAxis
    │   ├── Top (38)                ← CC_WorkPlane (XY)
    │   ├── Front (42)              ← CC_WorkPlane (XZ)
    │   └── Right (46)              ← CC_WorkPlane (YZ)
    ├── ReferenceSet (12)
    ├── SketchSet (14)
    ├── EntitySet (16)
    └── OperationSequence (18)
        ├── OriginRef, XAxisRef, YAxisRef, ZAxisRef
        ├── TopRef, FrontRef, RightRef
        └── RollbackBar (20)
```

- `structure.root` = `structure.currentProduct` = partId (4) — the "root product", NOT the tree root. AllObjects (id=1, `parent: null`) is the tree root.
- All default nodes have `flags: 4096`.
- Find default work geometry by name: `part.getWorkGeometry({ id: partId, name: 'Top' })`.

## Gotchas

- **Second `part.create` is refused** with "There is already a root assembly or part which must be removed first" (result null); the first part remains intact. One `part.create` per cleared drawing.
- **Empty part has no visible geometry** — exports (OFB/STEP) succeed but there is nothing to render yet.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
// partId → 4; pass as `id` to nearly every subsequent part.* call
```

## Related

`common.clear` · `part.expression` · `part.workPlane` / `part.workAxis` · `part.entityInjection` · `part.sketch` / `sketch.create`
