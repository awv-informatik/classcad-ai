# ClassCAD API v1 — Learning Plan (v2)

> A structured, dependency-ordered learning path covering all 254 APIs across 7 domains.
> Each step builds upon the previous steps. Do not skip ahead.
>
> **Task naming:** Tasks prefixed with "Api study of" reference a specific API endpoint.
> Other tasks are conceptual studies, exercises, or integration checkpoints.

---

> ### GOLDEN RULE
>
> **Every task is LIVE.** You must connect to a ClassCAD instance via `node scripts/run.mjs` and
> validate every example script against the real server. No task is considered studied until you
> have run the code, observed the output, and confirmed the behavior matches (or doesn't match)
> the documentation. If something differs from the docs, that is a finding — journal it.

---

## Learning Path Overview

```
Step 1: I/O Protocol & API Fundamentals
   │   (no geometry yet — pure protocol understanding)
   │
   └─► Step 2: Part Foundations
        │   (part creation → work geometry → entity injection)
        │   (now we HAVE objects — IDs become real)
        │
        ├─► Step 3: 2D Curves & Shapes
        │       (low-level geometry inside entity injection)
        │
        └─► Step 4: Constrained Sketches
                (parametric 2D geometry inside parts)
                │
                └─► Step 5: 3D Solids
                     │  (primitives, extrusions, booleans — direct operations)
                     │
                     └─► Step 6: Drawing Management & Object Properties
                          │  (NOW we have geometry: save/load, appearance, faceting, user data)
                          │
                          └─► Step 7: Part Features (Parametric Modeling)
                               │  (feature history, expressions, design intent)
                               │
                               └─► Step 8: Assemblies
                                    │  (multi-part structures, constraints, kinematics)
                                    │
                                    └─► Step 9: Technical Drawings
                                         (2D views, dimensions, DXF/SVG export)
```

---

## Step 1: I/O Protocol & API Fundamentals

**What you will learn:** How the ClassCAD API communicates — the JSON request/response protocol, how results are structured, how errors and messages work, what IDs are, what points are. No geometry is created in this step. You cannot use load/save/clear/recalc yet because there are no objects in the drawing. This step is pure protocol literacy.

**Prerequisites:** None — this is the starting point.

### Category 1.1: Protocol & Data Model

**Essentials:** Every API call returns `{ result, messages?, maxLevel? }`. Results can be IDs, values, arrays, or VOID. Messages carry warnings and errors with level codes. Understanding this envelope is mandatory before making any call.

**Foundations:** IDs are opaque references — they identify every object in the system. Points are `[x, y, z]` arrays. Reals are numbers. Booleans use TRUE/FALSE constants. Every subsequent step depends on fluency with these types.

| #   | Task                                                                                                                      | Source   | Studied |
| --- | ------------------------------------------------------------------------------------------------------------------------- | -------- | ------- |
| 1   | Study of the JSON request/response protocol envelope: `{ result, messages?, maxLevel? }`                                  | all docs | [✅]    |
| 2   | Study of result types: `id`, `VOID`, `real`, `point`, `string`, `boolean`, `Array<id>`                                    | all docs | [ ]     |
| 3   | Study of the message system: `{ message, level, code, api }` — warning levels, error codes, how to detect failures        | all docs | [ ]     |
| 4   | Study of the ID system: opaque references, how IDs are returned from creation APIs and consumed by subsequent APIs        | all docs | [ ]     |
| 5   | Study of data types: `point` as `[x, y, z]`, coordinate conventions, angle units (radians), transformation matrices (4x4) | all docs | [ ]     |

**Task #1: Study of the JSON request/response protocol envelope**

Every API call wraps its result in a standard envelope: `{ result, messages?, maxLevel? }`. The `result` field carries the actual payload (an ID, a value, VOID, or an array). The `messages` array (if present) carries warnings/errors, each with `{ message, level, code, api }`. The `maxLevel` field is the highest severity among all messages. Learning to read this envelope is Step 0 for everything.

```js
// Observe the envelope by calling any stateless API:
export default async function ({ execute }) {
  const res = await execute({ 'v1.common.getAppVersion': [{}] })
  // res = { result: "", messages: [...], maxLevel: 0 }
  return { fullEnvelope: res }
}
```

**Task #2-5:** These are conceptual — study the documentation tables for data types, message levels (trace=11, debug=21, info=31, warning=41, error=51, fatal=61), and ID semantics. No script needed, but confirm understanding by inspecting real return values in subsequent tasks.

---

### Category 1.2: Stateless Queries (no objects required)

**Summary:** These APIs work without any objects in the drawing. They are safe to call immediately and help verify the API connection is working.

| #   | Task                                                                  | Source                                                                 | Studied |
| --- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| 1   | Api study of `common.getAppVersion`                                   | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |
| 2   | Api study of `common.getClassFileVersion`                             | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |
| 3   | Api study of `common.evaluateExpression` — standalone math evaluation | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |

**Task #1: Api study of `common.getAppVersion`**

Returns the application version string. Takes no parameters. Useful as a connection health check.

```js
export default async function ({ execute }) {
  const res = await execute({ 'v1.common.getAppVersion': [{}] })
  // ✓ result → "" (version string)
  return { version: res.result }
}
```

**Task #2: Api study of `common.getClassFileVersion`**

Returns the class file version string. Takes no parameters.

```js
export default async function ({ execute }) {
  const res = await execute({ 'v1.common.getClassFileVersion': [{}] })
  // ✓ result → "" (file version string)
  return { fileVersion: res.result }
}
```

**Task #3: Api study of `common.evaluateExpression`**

Evaluates a math expression string. Supports ClassCAD constants like `C:PI`. Can optionally reference a part/assembly via `id`. The `silent` param suppresses error messages.

```js
export default async function ({ execute }) {
  const r1 = await execute({ 'v1.common.evaluateExpression': [{ expression: 'sin(C:PI/2)' }] })
  const r2 = await execute({ 'v1.common.evaluateExpression': [{ expression: '2+3*4' }] })
  const r3 = await execute({ 'v1.common.evaluateExpression': [{ expression: 'sqrt(144)' }] })
  // ✓ r1.result → 1, r2.result → 14, r3.result → 12
  return { sinPiOver2: r1.result, mathExpr: r2.result, sqrt144: r3.result }
}
```

---

### Category 1.3: Batching (conceptual)

**Summary:** Understanding how `batch` works — sequencing multiple API calls into one request. Each job in the `jobs` array is an API call; results are returned per-job.

| #   | Task                                                                                 | Source                                                                 | Studied |
| --- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------- |
| 1   | Api study of `common.batch` — how jobs array works, how results are returned per-job | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |

**Task #1: Api study of `common.batch`**

Batch sends multiple API calls in a single request. Each job has `api` (string) and optional `param` (object). Results come back as an array, one entry per job.

```js
export default async function ({ execute }) {
  const res = await execute({
    'v1.common.batch': [
      {
        jobs: [
          { api: 'v1.common.getAppVersion' },
          { api: 'v1.common.getClassFileVersion' },
          { api: 'v1.common.evaluateExpression', param: { expression: '6*7' } },
        ],
      },
    ],
  })
  // ✓ result → [{ result: "" }, { result: "" }, { result: 42 }]
  return { batchResults: res.result }
}
```

---

## Step 2: Part Foundations

**What you will learn:** How to create the foundational container for all 3D modeling — the Part. Then how to define construction geometry (work planes, axes, coordinate systems, points) that positions everything else. Finally, how to create Entity Injection features — the containers where low-level curves and solids live.

**Prerequisites:** Step 1 (Protocol — you need to understand IDs and return values)

**Why this order:** Part must come first because everything lives inside a part. Work geometry comes second because sketches and features are placed relative to work planes/axes. Entity injection comes last because it's the bridge to direct curve/solid operations (Steps 3 & 5).

### Category 2.1: Part Creation

**Essentials:** `part.create` clears the drawing and initializes a new part. This is the first API that creates a real object. After this call, you have an ID — the part ID.

| #   | Task                       | Source                                                             | Studied |
| --- | -------------------------- | ------------------------------------------------------------------ | ------- |
| 1   | Api study of `part.create` | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |

**Task #1: Api study of `part.create`**

Creates a new part and returns its ID. The optional `name` parameter names it. This clears any existing drawing content.

```js
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'MyPart' }] })).result
  // ✓ partId → 4 (numeric ID, varies per session)
  return { partId }
}
```

---

### Category 2.2: Work Geometry

**Essentials:** Work geometry defines invisible construction references. Work planes are where sketches are drawn. Work axes define rotation centers. Work coordinate systems define local reference frames. Work points mark positions.

| #   | Task                                                                   | Source                                                             | Studied |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ | ------- |
| 1   | Api study of `part.workPlane`                                          | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 2   | Api study of `part.updateWorkPlane`                                    | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 3   | Api study of `part.workAxis`                                           | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 4   | Api study of `part.updateWorkAxis`                                     | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 5   | Api study of `part.workCSys`                                           | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 6   | Api study of `part.updateWorkCSys`                                     | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 7   | Api study of `part.workPoint`                                          | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 8   | Api study of `part.updateWorkPoint`                                    | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 9   | Api study of `part.getWorkGeometry` — retrieving work geometry by name | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |

**Task #1-8: Work geometry creation**

Each work geometry type takes the part ID, a name, and positioning parameters. All return the feature ID of the created work geometry.

```js
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'WGTest' }] })).result

  const wpId = (
    await execute({ 'v1.part.workPlane': [{ id: partId, name: 'WP1', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0] }] })
  ).result
  const waId = (await execute({ 'v1.part.workAxis': [{ id: partId, name: 'WA1', origin: [0, 0, 0], direction: [0, 1, 0] }] })).result
  const wcsId = (
    await execute({
      'v1.part.workCSys': [{ id: partId, name: 'WCS1', origin: [10, 20, 30], xDirection: [1, 0, 0], yDirection: [0, 1, 0] }],
    })
  ).result
  const wptId = (await execute({ 'v1.part.workPoint': [{ id: partId, name: 'WPt1', position: [5, 5, 5] }] })).result

  // ✓ wpId → 54, waId → 62, wcsId → 70, wptId → 78
  return { wpId, waId, wcsId, wptId }
}
```

**Task #9: Api study of `part.getWorkGeometry`**

Retrieves a work geometry ID by name. Useful for finding default planes (XY, XZ, YZ) or named custom work geometry.

```js
// ...after part.create and workPlane creation...
const gwId = (await execute({ 'v1.part.getWorkGeometry': [{ id: partId, name: 'WP1' }] })).result
// ✓ gwId → same as wpId (54)
```

---

### Category 2.3: Entity Injection

**Essentials:** An Entity Injection is a special feature that acts as a container for direct geometry (curves from Step 3, solids from Step 5). Created inside a part.

| #   | Task                                                                                 | Source                                                             | Studied |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ------- |
| 1   | Api study of `part.entityInjection`                                                  | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 2   | Study: relationship between entity injection IDs and curve/solid API `id` parameters | all docs                                                           | [ ]     |

**Task #1: Api study of `part.entityInjection`**

Creates an entity injection feature inside a part. The returned ID is what you pass as `id` to all `solid.*` and `curve.shape()` calls.

```js
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'EITest' }] })).result
  const eifId = (await execute({ 'v1.part.entityInjection': [{ id: partId, name: 'EIF1' }] })).result
  // ✓ eifId → 54 (this ID goes into solid.box({ id: eifId, ... }))
  return { partId, eifId }
}
```

---

### Category 2.4: Object Naming (first use)

| #   | Task                                | Source                                                                 | Studied |
| --- | ----------------------------------- | ---------------------------------------------------------------------- | ------- |
| 1   | Api study of `common.setObjectName` | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |

**Task #1: Api study of `common.setObjectName`**

Renames any object by ID. Now that we have parts and features, we can name them.

```js
// ...after creating an entity injection feature...
await execute({ 'v1.common.setObjectName': [{ id: eifId, name: 'RenamedEIF' }] })
// ✓ result → null (VOID)
```

---

## Step 3: 2D Curves & Shapes

**What you will learn:** Shape containers within entity injections, populated with 2D/3D curves. Lines, arcs, circles, ellipses, Bezier curves, polylines, the advanced polyline system, shape transforms, and 2D booleans.

**Prerequisites:** Step 2 (Parts & Entity Injection — you need an entity injection feature ID)

### Category 3.1: Shape Containers

**Essentials:** A Shape is a named container for curves, created inside an entity injection feature. All curve creation APIs require a shape ID.

| #   | Task                                                                     | Source                                                               | Studied |
| --- | ------------------------------------------------------------------------ | -------------------------------------------------------------------- | ------- |
| 1   | Api study of `curve.shape`                                               | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |
| 2   | Api study of `curve.deleteShape`                                         | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |
| 3   | Api study of `curve.cleanShape` — deletes curves but keeps the container | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |

**Task #1: Api study of `curve.shape`**

Creates a shape container inside an entity injection. Returns the shape ID that all curve APIs require.

```js
// ...after part.create + entityInjection setup...
const shapeId = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'S1' }] })).result
// ✓ shapeId → 60
```

**Task #2-3:** `deleteShape({ ids: [shapeId1, shapeId2] })` removes shapes entirely. `cleanShape({ ids: [shapeId] })` deletes curves but keeps the empty container for reuse.

---

### Category 3.2: Basic Curves

| #   | Task                                     | Source                                                               | Studied |
| --- | ---------------------------------------- | -------------------------------------------------------------------- | ------- |
| 1   | Api study of `curve.line`                | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |
| 2   | Api study of `curve.circle`              | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |
| 3   | Api study of `curve.arcBy3Points`        | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |
| 4   | Api study of `curve.arcByCenter`         | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |
| 5   | Api study of `curve.arcByCenterRadAngle` | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |

**Task #1-3: Basic curve creation**

All curve APIs take `id` = shape ID and return VOID. The curves are added to the shape.

```js
// ...after part + eif + shape setup...
await execute({ 'v1.curve.line': [{ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] }] })
await execute({ 'v1.curve.circle': [{ id: shapeId, centerPos: [25, 25, 0], radius: 10 }] })
await execute({ 'v1.curve.arcBy3Points': [{ id: shapeId, startPos: [0, 50, 0], midPos: [25, 60, 0], endPos: [50, 50, 0] }] })
// ✓ all return null (VOID) — curves are added to the shape
```

**Task #4:** `arcByCenter` — arc defined by center, start, end, and clockwise flag: `{ id: shapeId, centerPos: [0,0,0], startPos: [10,0,0], endPos: [0,10,0], isClockwise: true }`

**Task #5:** `arcByCenterRadAngle` — arc by center, radius, and start/end angles (radians): `{ id: shapeId, centerPos: [0,0,0], startAngle: 0, endAngle: 1.57, radius: 5 }`

---

### Category 3.3: Advanced Curves

| #   | Task                                    | Source                                                               | Studied |
| --- | --------------------------------------- | -------------------------------------------------------------------- | ------- |
| 1   | Api study of `curve.ellipse`            | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |
| 2   | Api study of `curve.ellipticArc`        | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |
| 3   | Api study of `curve.bezierCurve`        | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |
| 4   | Api study of `curve.interpolationCurve` | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |

**Task #1-4: Advanced curve types**

```js
// ...after part + eif setup...
const s1 = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'AdvCurves' }] })).result
await execute({ 'v1.curve.ellipse': [{ id: s1, centerPos: [0, 0, 0], radius1: 20, radius2: 10 }] })
await execute({
  'v1.curve.bezierCurve': [
    {
      id: s1,
      points: [
        [40, 0, 0],
        [45, 20, 0],
        [55, 20, 0],
        [60, 0, 0],
      ],
    },
  ],
})
await execute({
  'v1.curve.interpolationCurve': [
    {
      id: s1,
      points: [
        [0, 40, 0],
        [10, 55, 0],
        [20, 40, 0],
        [30, 55, 0],
        [40, 40, 0],
      ],
    },
  ],
})
// ✓ all return null — curves added to shape
```

---

### Category 3.4: Polylines

| #   | Task                                                                                                       | Source                                                               | Studied |
| --- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------- |
| 1   | Api study of `curve.polyline2d` — points + bulges                                                          | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |
| 2   | Api study of `curve.advancedPolyline` — PLD system                                                         | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |
| 3   | Study: bulge values — `tan(a/4)`, 0=line, 1=semicircle, negative=clockwise                                 | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |
| 4   | Study: advanced polyline PLD modes — `xa/ya` vs `xr/yr` vs `l/a` vs `l/ar`, radius `r`, chamfer `c`, close | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |

**Task #1: Api study of `curve.polyline2d`**

Points + optional bulges (arc control per segment). `close: true` connects last point to first.

```js
// ...after setup...
const s2 = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'Poly' }] })).result
await execute({
  'v1.curve.polyline2d': [
    {
      id: s2,
      points: [
        [0, 0, 0],
        [20, 0, 0],
        [20, 20, 0],
        [0, 20, 0],
      ],
      bulges: [0, 0.414, 0, 0], // 0.414 ≈ tan(π/8) → 90° arc on 2nd segment
      close: true,
    },
  ],
})
// ✓ result → null
```

**Task #2: Api study of `curve.advancedPolyline`**

The PLD (PointLineDefinition) system — absolute coords (`xa/ya`), relative (`xr/yr`), angle+length (`l/a`), radius fillet (`r`), chamfer (`c`), and `close`.

```js
const s3 = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'AdvPoly' }] })).result
await execute({
  'v1.curve.advancedPolyline': [
    {
      id: s3,
      pld: [
        { xa: 0, ya: 0 }, // start at absolute (0,0)
        { xa: 30, ya: 0, r: 5 }, // to (30,0) with 5mm radius fillet
        { xa: 30, ya: 20, r: 5 }, // to (30,20) with fillet
        { xa: 0, ya: 20 }, // to (0,20)
      ],
      close: true,
    },
  ],
})
// ✓ result → null — closed rounded rectangle
```

---

### Category 3.5: Shape Transformations

| #   | Task                                                                      | Source                                                               | Studied |
| --- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------- |
| 1   | Api study of `curve.translateShape`                                       | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |
| 2   | Api study of `curve.rotateShape`                                          | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |
| 3   | Api study of `curve.transformShape` — 4x4 matrix (orthogonal, no scaling) | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |
| 4   | Api study of `curve.scaleShape`                                           | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |

**Task #1-4: Shape transforms**

```js
// ...after creating a shape with curves...
await execute({ 'v1.curve.translateShape': [{ id: shapeId, translation: [25, 0, 0] }] })
await execute({ 'v1.curve.rotateShape': [{ id: shapeId, rotation: [0, 0, 1.57] }] }) // 90° around Z
await execute({ 'v1.curve.scaleShape': [{ id: shapeId, factor: 2.0 }] })
// transformShape needs orthogonal 4x4 matrix (no scaling in the matrix)
await execute({
  'v1.curve.transformShape': [
    {
      id: shapeId,
      matrix: [
        [0, 1, 0, 100],
        [-1, 0, 0, 50],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ],
    },
  ],
})
```

---

### Category 3.6: 2D Boolean Operations on Shapes

| #   | Task                                | Source                                                               | Studied |
| --- | ----------------------------------- | -------------------------------------------------------------------- | ------- |
| 1   | Api study of `curve.union2d`        | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |
| 2   | Api study of `curve.subtraction2d`  | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |
| 3   | Api study of `curve.intersection2d` | [curve.md](../../node_modules/@classcad/api-js/doc/apis/v1/curve.md) | [ ]     |

**Task #1-3: 2D booleans**

Operate on two closed shapes. `target` is modified, `tool` is consumed (unless `keepShape: true`).

```js
// ...after creating two overlapping closed shapes s1 and s2...
await execute({ 'v1.curve.union2d': [{ target: s1, tool: s2 }] })
// ✓ result → null — s1 now contains the union, s2 is consumed
// For subtraction/intersection: same pattern
// await execute({ 'v1.curve.subtraction2d': [{ target: s1, tool: s2, keepShape: true }] })
```

---

## Step 4: Constrained Sketches

**What you will learn:** The sketch system — constraint-driven 2D geometry with geometric constraints, dimensional constraints, regions, patterns, reference geometry, and parametric updates.

**Prerequisites:** Step 2 (Parts — sketches live inside parts on work planes)

### Category 4.1: Sketch Lifecycle

| #   | Task                                                    | Source                                                                 | Studied |
| --- | ------------------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.create`                            | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 2   | Api study of `sketch.setWorkPlane`                      | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 3   | Api study of `sketch.deleteSketch`                      | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 4   | Api study of `part.sketch` — creating from part context | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md)     | [ ]     |
| 5   | Api study of `part.getSketch`                           | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md)     | [ ]     |

**Task #1: Api study of `sketch.create`**

Creates a sketch inside a part. Returns the sketch ID. By default placed on XY plane.

```js
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'SketchTest' }] })).result
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result
  // ✓ skId → 52
  return { partId, skId }
}
```

**Task #4: Api study of `part.sketch`**

Alternative way to create a sketch — from the part API. Returns sketch ID.

```js
const skId = (await execute({ 'v1.part.sketch': [{ id: partId, name: 'Sk1' }] })).result
// ✓ skId → 89
```

---

### Category 4.2: Basic Sketch Geometry

| #   | Task                                                                  | Source                                                                 | Studied |
| --- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.point`                                           | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 2   | Api study of `sketch.line`                                            | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 3   | Api study of `sketch.circle`                                          | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 4   | Api study of `sketch.arcByCenter`                                     | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 5   | Api study of `sketch.arcBy3Points`                                    | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 6   | Api study of `sketch.rectangle`                                       | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 7   | Api study of `sketch.geometry` — generic multi-type geometry creation | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |

**Task #2: Api study of `sketch.line`**

Creates a line in the sketch. Returns the line's sketch-curve ID.

```js
// ...after sketch.create...
const lineId = (await execute({ 'v1.sketch.line': [{ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] }] })).result
// ✓ lineId → 58
```

**Task #6: Api study of `sketch.rectangle`**

Creates 4 lines forming a rectangle. Returns an array of 4 sketch-curve IDs.

```js
const rectIds = (await execute({ 'v1.sketch.rectangle': [{ id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0] }] })).result
// ✓ rectIds → [58, 64, 70, 76] (four line IDs)
```

---

### Category 4.3: Geometric Constraints

| #   | Task                                                                                                                            | Source                                                                 | Studied |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.constraint` — all constraint types                                                                         | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 2   | Api study of `sketch.generateAutoConstraints`                                                                                   | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 3   | Study: constraint types — coincident, parallel, perpendicular, tangent, equal, horizontal, vertical, symmetric, fixed, midpoint | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |

**Task #1:** Study the `constraint` API and all its type variants in the reference docs. This requires careful reading of parameter structures per constraint type.

---

### Category 4.4: Dimensional Constraints

| #   | Task                                                                                                      | Source                                                                 | Studied |
| --- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.dimension`                                                                           | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 2   | Api study of `sketch.updateDimension`                                                                     | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 3   | Api study of `sketch.updateDimensionPosition`                                                             | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 4   | Study: dimension types — RADIUS, DIAMETER, OFFSET, HORIZONTAL_DISTANCE, VERTICAL_DISTANCE, ANGLE, ANGLEOX | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |

**Task #1: Api study of `sketch.dimension`**

Creates a dimension. Requires `type` and `geomIds` (the sketch curve IDs to dimension).

```js
// ...after creating a rectangle...
const dimId = (await execute({ 'v1.sketch.dimension': [{ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] }] })).result
// ✓ dimId → 94
```

---

### Category 4.5: Sketch Regions

| #   | Task                                     | Source                                                                 | Studied |
| --- | ---------------------------------------- | ---------------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.sketchRegion`       | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 2   | Api study of `sketch.updateSketchRegion` | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 3   | Api study of `sketch.getSketchRegion`    | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 4   | Api study of `part.getSketchRegion`      | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md)     | [ ]     |

**Task #1: Api study of `sketch.sketchRegion`**

Creates a closed region from sketch curves. The `geomIds` array must form a closed profile. Region IDs are what extrusion/revolve features consume.

```js
// ...after creating a rectangle [58,64,70,76]...
const regionId = (await execute({ 'v1.sketch.sketchRegion': [{ id: skId, geomIds: rectIds }] })).result
// ✓ regionId → 92
```

---

### Category 4.6: Updating & Querying Sketch Geometry

| #   | Task                                                       | Source                                                                 | Studied |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.updateGeometry`                       | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 2   | Api study of `sketch.getGeometry`                          | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 3   | Api study of `sketch.getPoints` — get point IDs of a curve | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 4   | Api study of `sketch.getPositions`                         | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 5   | Api study of `sketch.moveGeometry`                         | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |

**Task #2: Api study of `sketch.getGeometry`**

Returns all geometry IDs grouped by type from a sketch.

```js
const geo = (await execute({ 'v1.sketch.getGeometry': [{ id: skId }] })).result
// ✓ geo → { arcs: [], circles: [95], lines: [], points: [] }
```

**Task #3: Api study of `sketch.getPoints`**

Returns start/end point IDs of a sketch curve. The `id` param must be a sketch-curve ID (not the sketch ID).

```js
const pts = (await execute({ 'v1.sketch.getPoints': [{ id: rectIds[0] }] })).result
// ✓ pts → { startId: 59, endId: 60 }
```

---

### Category 4.7: Reference Geometry

| #   | Task                                          | Source                                                                 | Studied |
| --- | --------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.referenceGeometry`       | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 2   | Api study of `sketch.changeReferenceGeometry` | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 3   | Api study of `sketch.unlinkReferenceGeometry` | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 4   | Api study of `sketch.setReferences`           | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |

**Task #1-4:** Reference geometry projects 3D edges/faces into a sketch for constraining. Study the docs for parameter details — these require existing 3D geometry from prior features.

---

### Category 4.8: Patterns & Rigid Sets

| #   | Task                                  | Source                                                                 | Studied |
| --- | ------------------------------------- | ---------------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.rigidSet`        | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 2   | Api study of `sketch.linearPattern`   | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 3   | Api study of `sketch.circularPattern` | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 4   | Api study of `sketch.mirrorPattern`   | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |

---

### Category 4.9: Sketch Fillets

| #   | Task                             | Source                                                                 | Studied |
| --- | -------------------------------- | ---------------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.fillet`     | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 2   | Api study of `sketch.undoFillet` | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |

---

### Category 4.10: Trimming, Splitting & Curve Management

| #   | Task                                       | Source                                                                 | Studied |
| --- | ------------------------------------------ | ---------------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.trimCurves`           | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 2   | Api study of `sketch.splitAllCurves`       | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 3   | Api study of `sketch.splitCurves`          | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 4   | Api study of `sketch.splitCurvesMergeBack` | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 5   | Api study of `sketch.copyGeometry`         | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 6   | Api study of `sketch.copyFrom`             | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 7   | Api study of `sketch.loadFrom`             | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |
| 8   | Api study of `sketch.deleteObject`         | [sketch.md](../../node_modules/@classcad/api-js/doc/apis/v1/sketch.md) | [ ]     |

---

## Step 5: 3D Solids (Direct Operations)

**What you will learn:** Creating and manipulating 3D solid bodies directly within entity injection features — primitives, extrusion/revolve from profiles, booleans, transforms, and specialized operations.

**Prerequisites:** Step 2 (Entity Injection), Step 3 or 4 (profiles for extrusion/revolve)

### Category 5.1: Primitive Solids

| #   | Task                                                                | Source                                                               | Studied |
| --- | ------------------------------------------------------------------- | -------------------------------------------------------------------- | ------- |
| 1   | Api study of `solid.box`                                            | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |
| 2   | Api study of `solid.sphere`                                         | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |
| 3   | Api study of `solid.cylinder`                                       | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |
| 4   | Api study of `solid.cone`                                           | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |
| 5   | Study: common parameters — `rotation`, `translation`, `rotateFirst` | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |

**Task #1-4: Primitive solids**

All primitives take `id` = entity injection feature ID. They return the created solid's ID. Optional `translation` and `rotation` position the solid.

```js
export default async function ({ execute }, { snapshot }) {
  // ...after part + entityInjection setup...
  const boxId = (await execute({ 'v1.solid.box': [{ id: eifId, length: 40, width: 30, height: 20 }] })).result
  const sphId = (await execute({ 'v1.solid.sphere': [{ id: eifId, radius: 15, translation: [60, 0, 0] }] })).result
  const cylId = (await execute({ 'v1.solid.cylinder': [{ id: eifId, height: 30, diameter: 20, translation: [0, 60, 0] }] })).result
  const coneId = (await execute({ 'v1.solid.cone': [{ id: eifId, height: 25, bDiameter: 20, tDiameter: 5, translation: [60, 60, 0] }] }))
    .result
  // ✓ boxId → 61, sphId → 63, cylId → 67, coneId → 70
  await snapshot('solid-primitives')
  return { boxId, sphId, cylId, coneId }
}
```

---

### Category 5.2: Profile-Based Solids

| #   | Task                                                                          | Source                                                               | Studied |
| --- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------- |
| 1   | Api study of `solid.extrusion`                                                | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |
| 2   | Api study of `solid.revolve`                                                  | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |
| 3   | Study: how `curves` parameter works — shape ID vs array of sketch element IDs | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |

**Task #1-2: Extrusion + revolve from curve shapes**

```js
// Extrusion — sweep a closed profile along direction vector
const s1 = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'Profile' }] })).result
await execute({
  'v1.curve.advancedPolyline': [
    {
      id: s1,
      pld: [
        { xa: 0, ya: 0 },
        { xa: 30, ya: 0 },
        { xa: 30, ya: 20 },
        { xa: 0, ya: 20 },
      ],
      close: true,
    },
  ],
})
const extId = (await execute({ 'v1.solid.extrusion': [{ id: eifId, direction: [0, 0, 40], curves: s1 }] })).result
// ✓ extId → 64

// Revolve — rotate profile around axis
const s2 = (await execute({ 'v1.curve.shape': [{ id: eifId, name: 'RevProfile' }] })).result
await execute({
  'v1.curve.advancedPolyline': [
    {
      id: s2,
      pld: [
        { xa: 50, ya: 0 },
        { xa: 65, ya: 0 },
        { xa: 65, ya: 15 },
        { xa: 50, ya: 15 },
      ],
      close: true,
    },
  ],
})
const revId = (
  await execute({ 'v1.solid.revolve': [{ id: eifId, originPos: [50, 0, 0], direction: [0, 1, 0], angle: 6.283, curves: s2 }] })
).result
// ✓ revId → 70 (full 360° revolve = torus-like shape)
```

---

### Category 5.3: Boolean Operations

| #   | Task                                                           | Source                                                               | Studied |
| --- | -------------------------------------------------------------- | -------------------------------------------------------------------- | ------- |
| 1   | Api study of `solid.union`                                     | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |
| 2   | Api study of `solid.subtraction`                               | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |
| 3   | Api study of `solid.intersection`                              | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |
| 4   | Api study of `solid.merge` — NOT a union                       | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |
| 5   | Study: target/tools pattern — `target`, `tools[]`, `keepTools` | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |

**Task #1-2: Union + subtraction**

`target` is the base solid (modified in place). `tools` are consumed (unless `keepTools: true`).

```js
// ...after creating two overlapping boxes b1 and b2...
await execute({ 'v1.solid.union': [{ id: eifId, target: b1, tools: [b2] }] })
// ✓ result → b1 ID (b2 consumed into b1)

// Subtract a cylinder from the result
const cyl = (await execute({ 'v1.solid.cylinder': [{ id: eifId, height: 60, diameter: 15, translation: [20, 20, -5] }] })).result
await execute({ 'v1.solid.subtraction': [{ id: eifId, target: b1, tools: [cyl] }] })
// ✓ result → b1 ID (cylinder hole cut through)
```

---

### Category 5.4: Solid Transformations

| #   | Task                             | Source                                                               | Studied |
| --- | -------------------------------- | -------------------------------------------------------------------- | ------- |
| 1   | Api study of `solid.translation` | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |
| 2   | Api study of `solid.rotation`    | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |
| 3   | Api study of `solid.scale`       | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |
| 4   | Api study of `solid.mirror`      | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |

**Task #1-2: Translation + rotation**

```js
// ...after creating a box...
await execute({ 'v1.solid.translation': [{ id: eifId, target: boxId, translation: [50, 0, 0] }] })
await execute({ 'v1.solid.rotation': [{ id: eifId, target: box2Id, rotation: [0, 0, 0.785] }] }) // 45° around Z
// ✓ both return the solid ID
```

---

### Category 5.5: Cutting, Sectioning & Edge Operations

| #   | Task                                                  | Source                                                               | Studied |
| --- | ----------------------------------------------------- | -------------------------------------------------------------------- | ------- |
| 1   | Api study of `solid.offset` — fragile, use with care  | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |
| 2   | Api study of `solid.slice` — cut at plane             | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |
| 3   | Api study of `solid.section` — cross-section curves   | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |
| 4   | Api study of `solid.fillet` — fillet at brep edge IDs | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |

**Task #2-4:** Slice, section, and fillet require careful edge/face ID selection. Study the docs for the exact patterns.

---

### Category 5.6: Solid Management

| #   | Task                                                              | Source                                                               | Studied |
| --- | ----------------------------------------------------------------- | -------------------------------------------------------------------- | ------- |
| 1   | Api study of `solid.copy`                                         | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |
| 2   | Api study of `solid.deleteSolid`                                  | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |
| 3   | Api study of `solid.useSolid` — access solids from other features | [solid.md](../../node_modules/@classcad/api-js/doc/apis/v1/solid.md) | [ ]     |

**Task #1: Api study of `solid.copy`**

Copies a solid with optional translation/rotation.

```js
const copyId = (await execute({ 'v1.solid.copy': [{ id: eifId, target: boxId, translation: [0, 60, 0] }] })).result
// ✓ copyId → 63
```

---

## Step 6: Drawing Management & Object Properties

**What you will learn:** Now that you have real geometry, you can meaningfully use: saving/loading, clearing, recalculating, appearance, faceting, user metadata, coordinate systems, and matrix transforms.

**Prerequisites:** Step 5 (you need geometry for these to be meaningful)

### Category 6.1: Persistence — Save, Load, Clear

| #   | Task                                                           | Source                                                                 | Studied |
| --- | -------------------------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| 1   | Api study of `common.save`                                     | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |
| 2   | Api study of `common.load`                                     | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |
| 3   | Api study of `common.clear`                                    | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |
| 4   | Api study of `common.recalc`                                   | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |
| 5   | Study: format comparison — OFB vs STP vs STL vs DXF            | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |
| 6   | Study: encoding/compression pipeline — data ↔ deflate ↔ base64 | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |

**Task #1-4: Save/load/clear/recalc cycle**

```js
export default async function ({ execute }) {
  // ...after creating part + entityInjection + solid.box...
  // Save to OFB as base64 data
  const saveRes = (await execute({ 'v1.common.save': [{ format: 'OFB', encoding: 'base64' }] })).result
  // ✓ saveRes.content → "AQJjbGFzc2NhZAIB..." (base64 string)

  // Clear the drawing
  await execute({ 'v1.common.clear': [{}] })
  // ✓ drawing is now empty

  // Load back from saved data
  const loadRes = (await execute({ 'v1.common.load': [{ data: saveRes.content, format: 'OFB', encoding: 'base64' }] })).result
  // ✓ loadRes → { id: 4 } (root part ID)

  // Force recalculation
  await execute({ 'v1.common.recalc': [{}] })
  // ✓ result → null (VOID)
}
```

---

### Category 6.2: Appearance & Visualisation

| #   | Task                                       | Source                                                                 | Studied |
| --- | ------------------------------------------ | ---------------------------------------------------------------------- | ------- |
| 1   | Api study of `common.setAppearance`        | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |
| 2   | Api study of `common.requestVisualisation` | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |

**Task #1: Api study of `common.setAppearance`**

Sets color (RGB 0-255) and transparency (0-1) on a feature or specific solid indices.

```js
// ...after creating geometry...
await execute({ 'v1.common.setAppearance': [{ target: eifId, color: [255, 100, 0], transparency: 0.3 }] })
// ✓ result → null — feature now renders orange at 70% opacity
```

---

### Category 6.3: Faceting / Tessellation Control

| #   | Task                                                                        | Source                                                                 | Studied |
| --- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| 1   | Api study of `common.getDatabaseSettings`                                   | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |
| 2   | Api study of `common.setDatabaseSettings`                                   | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |
| 3   | Api study of `common.getFacetingParameters`                                 | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |
| 4   | Api study of `common.setFacetingParameters`                                 | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |
| 5   | Study: faceting concepts — chordHeightTol, angleTol, quality vs performance | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |

**Task #3-4: Faceting parameters**

```js
const fp = (await execute({ 'v1.common.getFacetingParameters': [{}] })).result
// ✓ fp → { angleTol: 0, chordHeightTol: 0.1 }

await execute({ 'v1.common.setFacetingParameters': [{ angleTol: 15, chordHeightTol: 0.2 }] })
// ✓ result → null — tessellation quality updated
```

---

### Category 6.4: Object Coordinate Systems & Transforms

| #   | Task                                            | Source                                                                 | Studied |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| 1   | Api study of `common.setObjectCoordSystem`      | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |
| 2   | Api study of `common.transformObjectWithMatrix` | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |

---

### Category 6.5: User Data (Custom Metadata)

| #   | Task                                                                              | Source                                                                 | Studied |
| --- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| 1   | Api study of `common.setUserData`                                                 | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |
| 2   | Api study of `common.getUserData`                                                 | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |
| 3   | Api study of `common.removeUserData`                                              | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |
| 4   | Api study of `common.clearUserData`                                               | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |
| 5   | Api study of `common.getUserDataKeys`                                             | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |
| 6   | Study: user data limitations — string keys/values only, not copied on duplication | [common.md](../../node_modules/@classcad/api-js/doc/apis/v1/common.md) | [ ]     |

**Task #1-5: User data CRUD**

String key-value store on any object. Not copied when objects are duplicated.

```js
export default async function ({ execute }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'UDTest' }] })).result

  await execute({ 'v1.common.setUserData': [{ id: partId, key: 'material', value: 'steel' }] })
  const ud = (await execute({ 'v1.common.getUserData': [{ id: partId, key: 'material' }] })).result
  const keys = (await execute({ 'v1.common.getUserDataKeys': [{ id: partId }] })).result
  await execute({ 'v1.common.removeUserData': [{ id: partId, key: 'material' }] })
  const after = (await execute({ 'v1.common.getUserData': [{ id: partId, key: 'material', defaultValue: 'none' }] })).result
  // ✓ ud → "steel", keys → ["material"], after → "none"
  return { ud, keys, after }
}
```

---

## Step 7: Part Features (Parametric Modeling)

**What you will learn:** Feature-based parametric modeling — features maintain design history, support update APIs, and can be driven by expressions.

**Prerequisites:** Steps 4 (Sketches), 5 (Solids), 6 (Drawing Management)

### Category 7.1: Primitive Features

| #   | Task                                                                    | Source                                                             | Studied |
| --- | ----------------------------------------------------------------------- | ------------------------------------------------------------------ | ------- |
| 1   | Api study of `part.box`                                                 | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 2   | Api study of `part.updateBox`                                           | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 3   | Api study of `part.cone`                                                | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 4   | Api study of `part.updateCone`                                          | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 5   | Api study of `part.cylinder`                                            | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 6   | Api study of `part.updateCylinder`                                      | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 7   | Api study of `part.sphere`                                              | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 8   | Api study of `part.updateSphere`                                        | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 9   | Study: `part.box` (feature) vs `solid.box` (direct) — when to use which | part.md, solid.md                                                  | [ ]     |

**Task #1: Api study of `part.box`**

Creates a box as a parametric feature. Unlike `solid.box`, this lives in the feature tree and supports `updateBox`. Optional `references` positions via a work coordinate system.

```js
const partId = (await execute({ 'v1.part.create': [{ name: 'FeatTest' }] })).result
const boxFeat = (await execute({ 'v1.part.box': [{ id: partId, name: 'Box1', length: 60, width: 40, height: 30 }] })).result
// ✓ boxFeat → 54 (feature ID in the design tree)
```

---

### Category 7.2: Profile-Based Features

| #   | Task                                | Source                                                             | Studied |
| --- | ----------------------------------- | ------------------------------------------------------------------ | ------- |
| 1   | Api study of `part.extrusion`       | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 2   | Api study of `part.updateExtrusion` | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 3   | Api study of `part.revolve`         | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 4   | Api study of `part.updateRevolve`   | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 5   | Api study of `part.twist`           | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 6   | Api study of `part.updateTwist`     | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |

**Task #1: Api study of `part.extrusion`**

Feature-level extrusion from a sketch region. Key param: `references` = array of sketch region IDs. Types: UP, DOWN, SYMMETRIC, CUSTOM.

```js
// ...after creating part + box feature...
const skId = (await execute({ 'v1.part.sketch': [{ id: partId, name: 'Sk1' }] })).result
const circleId = (await execute({ 'v1.sketch.circle': [{ id: skId, centerPos: [30, 20, 0], radius: 10 }] })).result
const regionId = (await execute({ 'v1.sketch.sketchRegion': [{ id: skId, geomIds: [circleId] }] })).result

const extFeat = (
  await execute({
    'v1.part.extrusion': [
      {
        id: partId,
        name: 'Hole',
        references: [regionId],
        type: 'UP',
        limit2: 35,
      },
    ],
  })
).result
// ✓ extFeat → 102 (extrusion feature ID)
```

---

### Category 7.3: Boolean & Cutting Features

| #   | Task                                     | Source                                                             | Studied |
| --- | ---------------------------------------- | ------------------------------------------------------------------ | ------- |
| 1   | Api study of `part.boolean`              | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 2   | Api study of `part.updateBoolean`        | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 3   | Api study of `part.slice`                | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 4   | Api study of `part.updateSlice`          | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 5   | Api study of `part.sliceBySheet`         | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 6   | Api study of `part.updateSliceBySheet`   | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 7   | Api study of `part.entityDeletion`       | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 8   | Api study of `part.updateEntityDeletion` | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |

---

### Category 7.4: Edge Features (Chamfer & Fillet)

| #   | Task                              | Source                                                             | Studied |
| --- | --------------------------------- | ------------------------------------------------------------------ | ------- |
| 1   | Api study of `part.chamfer`       | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 2   | Api study of `part.updateChamfer` | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 3   | Api study of `part.fillet`        | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 4   | Api study of `part.updateFillet`  | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |

**Task #3: Api study of `part.fillet`**

Creates a fillet feature. Param `references` = array of brep edge IDs (found via `getGeometryIds`).

```js
// ...after creating a box feature...
// First find the edge ID by providing a position ON the edge
const geoIds = (await execute({ 'v1.part.getGeometryIds': [{ id: partId, lines: [{ pos: [30, 0, 30] }] }] })).result
// ✓ geoIds → { lines: [75], ... }

const filletFeat = (await execute({ 'v1.part.fillet': [{ id: partId, name: 'Fillet1', references: geoIds.lines, radius: 5 }] })).result
// ✓ filletFeat → 91
```

---

### Category 7.5: Mirror & Pattern Features

| #   | Task                                      | Source                                                             | Studied |
| --- | ----------------------------------------- | ------------------------------------------------------------------ | ------- |
| 1   | Api study of `part.mirror`                | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 2   | Api study of `part.updateMirror`          | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 3   | Api study of `part.linearPattern`         | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 4   | Api study of `part.updateLinearPattern`   | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 5   | Api study of `part.circularPattern`       | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 6   | Api study of `part.updateCircularPattern` | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |

**Task #3: Api study of `part.linearPattern`**

Creates a linear pattern of features. Requires `targets` (feature IDs) and `dir1.references` (a work axis or two points defining the direction).

```js
// ...after creating a box feature + work axis...
const waId = (await execute({ 'v1.part.workAxis': [{ id: partId, name: 'PatAxis', origin: [0, 0, 0], direction: [1, 0, 0] }] })).result
const lpFeat = (
  await execute({
    'v1.part.linearPattern': [
      {
        id: partId,
        name: 'LP1',
        targets: [boxFeat],
        dir1: { references: [waId], distance: 30, count: 3 },
      },
    ],
  })
).result
// ✓ lpFeat → 99
```

---

### Category 7.6: Transformation Features

| #   | Task                                           | Source                                                             | Studied |
| --- | ---------------------------------------------- | ------------------------------------------------------------------ | ------- |
| 1   | Api study of `part.translation`                | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 2   | Api study of `part.updateTranslation`          | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 3   | Api study of `part.rotation`                   | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 4   | Api study of `part.updateRotation`             | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 5   | Api study of `part.transformationByCSys`       | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 6   | Api study of `part.updateTransformationByCSys` | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |

---

### Category 7.7: Expressions (Parametric Control)

| #   | Task                                                          | Source                                                             | Studied |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------------ | ------- |
| 1   | Api study of `part.expression` — create expressions           | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 2   | Api study of `part.getExpression`                             | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 3   | Api study of `part.updateExpression`                          | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 4   | Api study of `part.deleteExpression`                          | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 5   | Api study of `part.renameExpression`                          | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 6   | Api study of `part.linkWithExpression`                        | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 7   | Api study of `part.unlinkExpression`                          | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 8   | Study: expression workflow — create → link → update → observe | part.md                                                            | [ ]     |

**Task #1-3: Expression CRUD**

Expressions use `toCreate` array to batch-create, and `getExpression` to read back.

```js
const partId = (await execute({ 'v1.part.create': [{ name: 'ExprTest' }] })).result

await execute({
  'v1.part.expression': [
    {
      id: partId,
      toCreate: [
        { name: 'width', value: 50 },
        { name: 'height', value: 'width * 0.6' },
      ],
    },
  ],
})
// ✓ result → 1 (boolean true = success)

const val = (await execute({ 'v1.part.getExpression': [{ id: partId, name: 'height' }] })).result
// ✓ val → { expression: "width * 0.6", value: 30 }

await execute({ 'v1.part.updateExpression': [{ id: partId, name: 'width', value: '80' }] })
// After update + recalc, height would become 48
```

---

### Category 7.8: Import Features & Composite Curves

| #   | Task                                     | Source                                                             | Studied |
| --- | ---------------------------------------- | ------------------------------------------------------------------ | ------- |
| 1   | Api study of `part.importFeature`        | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 2   | Api study of `part.updateImportFeature`  | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 3   | Api study of `part.compositeCurve`       | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 4   | Api study of `part.updateCompositeCurve` | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |

---

### Category 7.9: Feature Management & Design History

| #   | Task                                       | Source                                                             | Studied |
| --- | ------------------------------------------ | ------------------------------------------------------------------ | ------- |
| 1   | Api study of `part.openFeature`            | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 2   | Api study of `part.closeFeature`           | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 3   | Api study of `part.operationMoveBefore`    | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 4   | Api study of `part.operationMoveToEnd`     | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 5   | Api study of `part.getFeature`             | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 6   | Api study of `part.deleteFeature`          | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 7   | Api study of `part.createUncommitedObject` | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 8   | Study: RollbackBar vs GhostRollbackBar     | part.md                                                            | [ ]     |

---

### Category 7.10: Appearance, Mass Properties & Geometry Queries

| #   | Task                                                                      | Source                                                             | Studied |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------- |
| 1   | Api study of `part.setAppearance`                                         | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 2   | Api study of `part.calculateMassProperties`                               | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 3   | Api study of `part.getGeometryIds`                                        | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 4   | Api study of `part.getGeometryPositions`                                  | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 5   | Api study of `part.getBrepGeometryIndex`                                  | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 6   | Api study of `part.getBrepGeometryByIndex`                                | [part.md](../../node_modules/@classcad/api-js/doc/apis/v1/part.md) | [ ]     |
| 7   | Study: brep geometry access pattern — finding edge IDs for chamfer/fillet | part.md                                                            | [ ]     |

**Task #3: Api study of `part.getGeometryIds`**

Finds brep geometry (edges, faces) by providing positions on or near them. Returns IDs grouped by type. The `id` param must be the **part** ID (not feature).

```js
const geoIds = (
  await execute({
    'v1.part.getGeometryIds': [
      {
        id: partId,
        lines: [{ pos: [30, 0, 30] }], // position ON the edge you want
      },
    ],
  })
).result
// ✓ geoIds → { lines: [75], arcs: [], circles: [], ... }
```

---

## Step 8: Assemblies

**What you will learn:** Multi-part structures: template/instance paradigm, constraints (fastened through kinematic), patterns, gear/group relations, and constraint-driven motion.

**Prerequisites:** Step 7 (complete parts to assemble)

### Category 8.1: Assembly Creation & Templates

| #   | Task                                        | Source                                                                     | Studied |
| --- | ------------------------------------------- | -------------------------------------------------------------------------- | ------- |
| 1   | Api study of `assembly.create`              | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 2   | Api study of `assembly.partTemplate`        | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 3   | Api study of `assembly.assemblyTemplate`    | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 4   | Api study of `assembly.getPartTemplate`     | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 5   | Api study of `assembly.getAssemblyTemplate` | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 6   | Api study of `assembly.deleteTemplate`      | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 7   | Api study of `assembly.convertToTemplate`   | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 8   | Study: template vs instance paradigm        | assembly.md                                                                | [ ]     |

**Task #1-2: Assembly + part template creation**

```js
const asmId = (await execute({ 'v1.assembly.create': [{}] })).result
// ✓ asmId → 12 (root assembly ID)

const tplId = (await execute({ 'v1.assembly.partTemplate': [{}] })).result
// ✓ tplId → 22 (part template — now in part context, build geometry here)

// Build geometry inside the template
const boxFeat = (await execute({ 'v1.part.box': [{ id: tplId, name: 'Box1', length: 40, width: 30, height: 20 }] })).result
const wcsId = (
  await execute({ 'v1.part.workCSys': [{ id: tplId, name: 'WCS1', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] }] })
).result

// Return to assembly context
await execute({ 'v1.assembly.setCurrentProduct': [{ id: asmId }] })
```

---

### Category 8.2: Instances

| #   | Task                                   | Source                                                                     | Studied |
| --- | -------------------------------------- | -------------------------------------------------------------------------- | ------- |
| 1   | Api study of `assembly.instance`       | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 2   | Api study of `assembly.getInstance`    | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 3   | Api study of `assembly.deleteInstance` | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |

**Task #1: Api study of `assembly.instance`**

Creates an instance of a template. Requires `productId` (template) and `ownerId` (assembly or sub-assembly). Optional `transformation` positions it.

```js
const inst1 = (
  await execute({
    'v1.assembly.instance': [
      {
        productId: tplId,
        ownerId: asmId,
        name: 'Inst1',
      },
    ],
  })
).result
// ✓ inst1 → 113

const inst2 = (
  await execute({
    'v1.assembly.instance': [
      {
        productId: tplId,
        ownerId: asmId,
        name: 'Inst2',
        transformation: [
          [50, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
        ], // offset by 50 in X
      },
    ],
  })
).result
// ✓ inst2 → 115
```

---

### Category 8.3: Basic Constraints (Fastened)

| #   | Task                                         | Source                                                                     | Studied |
| --- | -------------------------------------------- | -------------------------------------------------------------------------- | ------- |
| 1   | Api study of `assembly.fastened`             | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 2   | Api study of `assembly.updateFastened`       | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 3   | Api study of `assembly.getFastened`          | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 4   | Api study of `assembly.fastenedOrigin`       | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 5   | Api study of `assembly.updateFastenedOrigin` | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 6   | Api study of `assembly.getFastenedOrigin`    | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |

**Task #4: Api study of `assembly.fastenedOrigin`**

Locks an instance at the assembly origin. Requires `mate1` with `path` (array with instance ID) and `csys` (work coordinate system from the template).

```js
await execute({
  'v1.assembly.fastenedOrigin': [
    {
      id: asmId,
      instance: inst1,
      name: 'FO1',
      mate1: { path: [inst1], csys: wcsId },
    },
  ],
})
// ✓ result → 121 (constraint ID)
```

---

### Category 8.4: Kinematic Constraints

| #   | Task                                      | Source                                                                     | Studied |
| --- | ----------------------------------------- | -------------------------------------------------------------------------- | ------- |
| 1   | Api study of `assembly.revolute`          | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 2   | Api study of `assembly.updateRevolute`    | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 3   | Api study of `assembly.getRevolute`       | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 4   | Api study of `assembly.cylindrical`       | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 5   | Api study of `assembly.updateCylindrical` | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 6   | Api study of `assembly.getCylindrical`    | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 7   | Api study of `assembly.planar`            | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 8   | Api study of `assembly.updatePlanar`      | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 9   | Api study of `assembly.getPlanar`         | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 10  | Api study of `assembly.parallel`          | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 11  | Api study of `assembly.updateParallel`    | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 12  | Api study of `assembly.getParallel`       | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 13  | Api study of `assembly.slider`            | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 14  | Api study of `assembly.updateSlider`      | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 15  | Api study of `assembly.getSlider`         | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 16  | Api study of `assembly.spherical`         | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 17  | Api study of `assembly.updateSpherical`   | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 18  | Api study of `assembly.getSpherical`      | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |

**Task #1-18:** All kinematic constraints follow the mate1/mate2 pattern. Study the specific DOF (degrees of freedom) each type provides. Requires careful reading of the assembly reference docs.

---

### Category 8.5: Relations (Gear & Group)

| #   | Task                                | Source                                                                     | Studied |
| --- | ----------------------------------- | -------------------------------------------------------------------------- | ------- |
| 1   | Api study of `assembly.gear`        | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 2   | Api study of `assembly.updateGear`  | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 3   | Api study of `assembly.getGear`     | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 4   | Api study of `assembly.group`       | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 5   | Api study of `assembly.updateGroup` | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 6   | Api study of `assembly.getGroup`    | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |

---

### Category 8.6: Constraint Management

| #   | Task                                            | Source                                                                     | Studied |
| --- | ----------------------------------------------- | -------------------------------------------------------------------------- | ------- |
| 1   | Api study of `assembly.deleteConstraint`        | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 2   | Api study of `assembly.update3DConstraintValue` | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |

---

### Category 8.7: Assembly Patterns

| #   | Task                                          | Source                                                                     | Studied |
| --- | --------------------------------------------- | -------------------------------------------------------------------------- | ------- |
| 1   | Api study of `assembly.linearPattern`         | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 2   | Api study of `assembly.updateLinearPattern`   | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 3   | Api study of `assembly.getLinearPattern`      | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 4   | Api study of `assembly.circularPattern`       | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 5   | Api study of `assembly.updateCircularPattern` | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 6   | Api study of `assembly.getCircularPattern`    | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |

---

### Category 8.8: Instance Transforms & Constraint-Driven Motion

| #   | Task                                                             | Source                                                                     | Studied |
| --- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- | ------- |
| 1   | Api study of `assembly.transformInstance`                        | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 2   | Api study of `assembly.transformInstanceTo`                      | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 3   | Api study of `assembly.startMovingUnderConstraints`              | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 4   | Api study of `assembly.moveUnderConstraints`                     | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 5   | Api study of `assembly.finishMovingUnderConstraints`             | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 6   | Study: constraint-driven motion workflow — start → move → finish | assembly.md                                                                | [ ]     |

---

### Category 8.9: Assembly Management

| #   | Task                                               | Source                                                                     | Studied |
| --- | -------------------------------------------------- | -------------------------------------------------------------------------- | ------- |
| 1   | Api study of `assembly.setCurrentInstance`         | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 2   | Api study of `assembly.setCurrentProduct`          | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 3   | Api study of `assembly.setIdent`                   | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 4   | Api study of `assembly.from` — JSON/ECXML assembly | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 5   | Api study of `assembly.loadProduct`                | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 6   | Api study of `assembly.exportNode`                 | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 7   | Api study of `assembly.getWorkGeometry`            | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 8   | Api study of `assembly.calculateMassProperties`    | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |
| 9   | Api study of `assembly.createUncommitedObject`     | [assembly.md](../../node_modules/@classcad/api-js/doc/apis/v1/assembly.md) | [ ]     |

---

## Step 9: Technical Drawings (Drawing2D)

**What you will learn:** 2D projections of 3D models — creating views, adding dimensions, exporting to DXF/SVG.

**Prerequisites:** Step 7 or 8 (need 3D models)

### Category 9.1: View Creation & Layout

| #   | Task                                            | Source                                                                       | Studied |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------------- | ------- |
| 1   | Api study of `drawing2d.view`                   | [drawing2d.md](../../node_modules/@classcad/api-js/doc/apis/v1/drawing2d.md) | [ ]     |
| 2   | Api study of `drawing2d.centerView`             | [drawing2d.md](../../node_modules/@classcad/api-js/doc/apis/v1/drawing2d.md) | [ ]     |
| 3   | Api study of `drawing2d.placeView`              | [drawing2d.md](../../node_modules/@classcad/api-js/doc/apis/v1/drawing2d.md) | [ ]     |
| 4   | Api study of `drawing2d.getBoundaryBoxFromView` | [drawing2d.md](../../node_modules/@classcad/api-js/doc/apis/v1/drawing2d.md) | [ ]     |

**Task #1: Api study of `drawing2d.view`**

Creates 2D projections. `types` array defines which views (TOP, FRONT, RIGHT, LEFT, BOTTOM, BACK, ISO, etc.).

```js
// ...after creating a part with a box feature...
const viewIds = (
  await execute({
    'v1.drawing2d.view': [
      {
        id: partId,
        types: ['TOP', 'FRONT', 'ISO'],
      },
    ],
  })
).result
// ✓ viewIds → [91, 101, 96] (one ID per view)
```

---

### Category 9.2: Dimensions

| #   | Task                                             | Source                                                                       | Studied |
| --- | ------------------------------------------------ | ---------------------------------------------------------------------------- | ------- |
| 1   | Api study of `drawing2d.dimension`               | [drawing2d.md](../../node_modules/@classcad/api-js/doc/apis/v1/drawing2d.md) | [ ]     |
| 2   | Api study of `drawing2d.deleteDimension`         | [drawing2d.md](../../node_modules/@classcad/api-js/doc/apis/v1/drawing2d.md) | [ ]     |
| 3   | Api study of `drawing2d.updateDimensionPosition` | [drawing2d.md](../../node_modules/@classcad/api-js/doc/apis/v1/drawing2d.md) | [ ]     |

---

### Category 9.3: Export & Availability

| #   | Task                                    | Source                                                                       | Studied |
| --- | --------------------------------------- | ---------------------------------------------------------------------------- | ------- |
| 1   | Api study of `drawing2d.exportDXF`      | [drawing2d.md](../../node_modules/@classcad/api-js/doc/apis/v1/drawing2d.md) | [ ]     |
| 2   | Api study of `drawing2d.exportSVG`      | [drawing2d.md](../../node_modules/@classcad/api-js/doc/apis/v1/drawing2d.md) | [ ]     |
| 3   | Api study of `drawing2d.isDXFAvailable` | [drawing2d.md](../../node_modules/@classcad/api-js/doc/apis/v1/drawing2d.md) | [ ]     |
| 4   | Api study of `drawing2d.isSVGAvailable` | [drawing2d.md](../../node_modules/@classcad/api-js/doc/apis/v1/drawing2d.md) | [ ]     |

**Task #3-4: Export availability checks**

```js
const dxfOk = (await execute({ 'v1.drawing2d.isDXFAvailable': [{}] })).result
const svgOk = (await execute({ 'v1.drawing2d.isSVGAvailable': [{}] })).result
// ✓ dxfOk → 0 (or 1 if DXF module loaded), svgOk → 0
```

---

## Summary

| Step | Topic                                  | Tasks   | Prerequisites   |
| ---- | -------------------------------------- | ------- | --------------- |
| 1    | I/O Protocol & API Fundamentals        | 9       | None            |
| 2    | Part Foundations                       | 13      | Step 1          |
| 3    | 2D Curves & Shapes                     | 24      | Step 2          |
| 4    | Constrained Sketches                   | 46      | Step 2          |
| 5    | 3D Solids (Direct)                     | 24      | Steps 2, 3 or 4 |
| 6    | Drawing Management & Object Properties | 23      | Step 5          |
| 7    | Part Features (Parametric)             | 80      | Steps 4, 5, 6   |
| 8    | Assemblies                             | 72      | Step 7          |
| 9    | Technical Drawings                     | 11      | Steps 7 or 8    |
|      | **Total**                              | **302** |                 |

> All example scripts in this document have been validated against a live ClassCAD server.
> The harness pattern is: `node scripts/run.mjs <script> --outdir <session-folder>`
