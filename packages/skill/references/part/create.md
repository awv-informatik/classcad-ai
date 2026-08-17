# part.create

Creates a new part and returns its ID. This is the first API that produces a real object — every modeling workflow starts here.

## Prerequisites

None — this is the entry point. Expects an empty drawing; call `common.clear` first if anything already exists.

## Key Parameters

- `name` — optional string, default `"Part"`. Sets the part name visible in the structure tree.
- No other parameters. Extra/unknown params silently ignored.
- Works with `{}`, `{ name: '...' }`, or no argument at all.

## Return Value

- **Type:** `id` (number)
- **Observed value:** `4` — always 4 in a clean session (AllObjects=1, then internal nodes, part=4)
- **maxLevel:** 31 (info) on success
- **messages:** `[]`

## Structure Tree After Creation

A new part creates **24 nodes**:

```
AllObjects (1)
└── CC_Part "YourName" (4)          ← this is the partId
    ├── ExpressionSet (6)
    ├── DimensionSet (8)
    ├── GeometrySet (10)
    │   ├── Origin (22)             ← CC_WorkPoint
    │   ├── XAxis (26)              ← CC_WorkAxis
    │   ├── YAxis (30)              ← CC_WorkAxis
    │   ├── ZAxis (34)              ← CC_WorkAxis
    │   ├── Top (38)                ← CC_WorkPlane (XY plane)
    │   ├── Front (42)              ← CC_WorkPlane (XZ plane)
    │   └── Right (46)              ← CC_WorkPlane (YZ plane)
    ├── ReferenceSet (12)
    ├── SketchSet (14)
    ├── EntitySet (16)
    └── OperationSequence (18)
        ├── OriginRef, XAxisRef, YAxisRef, ZAxisRef
        ├── TopRef, FrontRef, RightRef
        └── RollbackBar (20)
```

- `structure.root` = partId (4) — the "root product", not the tree root
- `structure.currentProduct` = partId (4)
- Default work geometry: **Top** (XY), **Front** (XZ), **Right** (YZ) planes, plus Origin point and XYZ axes
- All default nodes have `flags: 4096`

## Gotchas

- **Second `part.create` returns `null`.** The docs say "clears the drawing and creates a new part" but in practice, calling `part.create` twice in the same session returns `null` on the second call. The first part remains intact. **One `part.create` per cleared drawing** — `common.clear` first if you need a fresh part.
- **partId is always 4** in a clean session — don't hardcode it, but expect it.
- **Empty part has no visible geometry** — exports (OFB/STEP) succeed but there is nothing to render yet.
- `structure.root` is NOT the tree root (AllObjects). It's the "root product" (the part). AllObjects (id=1) is the actual tree root with `parent: null`.

## Usage Hints

- Always capture the returned ID: `const partId = (await api.v1.part.create({ name: '...' })).result`
- The partId is needed by nearly every subsequent API call (`id: partId`).
- Use `part.getWorkGeometry({ id: partId, name: 'Top' })` to find default work planes by name.
- Start every modeling session from a cleared drawing and call `part.create` exactly once.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
// partId → 4
// Default structure: 24 nodes including 3 work planes, 3 axes, 1 origin
```

## Related

- `common.clear` — clears the drawing; call it before re-creating a part
- `part.expression` — add named variables to the part
- `part.workPlane` / `part.workAxis` — add custom work geometry (defaults already exist)
- `part.entityInjection` — create a container for direct geometry (curves, solids)
- `part.sketch` / `sketch.create` — create sketches inside the part
