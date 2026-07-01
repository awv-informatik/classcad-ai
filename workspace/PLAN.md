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
        │   (part creation → expressions → open/close gate → work geometry → entity injection)
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
                               │  (feature history, design intent)
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
| 2   | Study of result types: `id`, `VOID`, `real`, `point`, `string`, `boolean`, `Array<id>`                                    | all docs | [✅]    |
| 3   | Study of the message system: `{ message, level, code, api }` — warning levels, error codes, how to detect failures        | all docs | [✅]    |
| 4   | Study of the ID system: opaque references, how IDs are returned from creation APIs and consumed by subsequent APIs        | all docs | [✅]    |
| 5   | Study of data types: `point` as `[x, y, z]`, coordinate conventions, angle units (radians), transformation matrices (4x4) | all docs | [✅]    |

**Task #1: Study of the JSON request/response protocol envelope**

Every API call wraps its result in a standard envelope: `{ result, messages?, maxLevel? }`. The `result` field carries the actual payload (an ID, a value, VOID, or an array). The `messages` array (if present) carries warnings/errors, each with `{ message, level, code, api }`. The `maxLevel` field is the highest severity among all messages. Learning to read this envelope is Step 0 for everything.

```js
// Observe the envelope by calling any stateless API:
export default async function (api) {
  const res = await api.v1.common.getAppVersion({})
  // res = { result: "", messages: [...], maxLevel: 0 }
  return { fullEnvelope: res }
}
```

**Task #2-5:** These are conceptual — study the documentation tables for data types, message levels (trace=11, debug=21, info=31, warning=41, error=51, fatal=61), and ID semantics. No script needed, but confirm understanding by inspecting real return values in subsequent tasks.

---

### Category 1.2: Stateless Queries (no objects required)

**Summary:** These APIs work without any objects in the drawing. They are safe to call immediately and help verify the API connection is working.

| #   | Task                                      | Source                                                            | Studied |
| --- | ----------------------------------------- | ----------------------------------------------------------------- | ------- |
| 1   | Api study of `common.getAppVersion`       | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |
| 2   | Api study of `common.getClassFileVersion` | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |

**Task #1: Api study of `common.getAppVersion`**

Returns the application version string. Takes no parameters. Useful as a connection health check.

```js
export default async function (api) {
  const res = await api.v1.common.getAppVersion({})
  // ✓ result → "" (version string)
  return { version: res.result }
}
```

**Task #2: Api study of `common.getClassFileVersion`**

Returns the class file version string. Takes no parameters.

```js
export default async function (api) {
  const res = await api.v1.common.getClassFileVersion({})
  // ✓ result → "" (file version string)
  return { fileVersion: res.result }
}
```

---

### Category 1.3: Batching (conceptual)

**Summary:** Understanding how `batch` works — sequencing multiple API calls into one request. Each job in the `jobs` array is an API call; results are returned per-job.

| #   | Task                                                                                 | Source                                                            | Studied |
| --- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ------- |
| 1   | Api study of `common.batch` — how jobs array works, how results are returned per-job | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |

**Task #1: Api study of `common.batch`**

Batch sends multiple API calls in a single request. Each job has `api` (string) and optional `param` (object). Results come back as an array, one entry per job.

```js
export default async function (api) {
  const res = await api.v1.common.batch({
    jobs: [
      { api: 'v1.common.getAppVersion' },
      { api: 'v1.common.getClassFileVersion' },
      { api: 'v1.common.evaluateExpression', param: { expression: '6*7' } },
    ],
  })
  // ✓ result → [{ result: "" }, { result: "" }, { result: 42 }]
  return { batchResults: res.result }
}
```

---

## Step 2: Part Foundations

**What you will learn:** How to create the foundational container for all 3D modeling — the Part. Then the expression system (named parametric variables that drive every feature). Then the open/close feature editing pattern (required for all `update*` calls). Then construction geometry (work planes, axes, coordinate systems, points). Finally, Entity Injection features — the containers where low-level curves and solids live.

**Prerequisites:** Step 1 (Protocol — you need to understand IDs and return values)

**Why this order:** Part must come first because everything lives inside a part. Expressions come second because even work geometry parameters can be expression-driven. Open/close comes third because every `update*` API needs it. Work geometry comes fourth because sketches and features are placed relative to work planes/axes. Entity injection comes last because it's the bridge to direct curve/solid operations (Steps 3 & 5).

### Category 2.1: Part Creation

**Essentials:** `part.create` clears the drawing and initializes a new part. This is the first API that creates a real object. After this call, you have an ID — the part ID.

| #   | Task                       | Source                                                        | Studied |
| --- | -------------------------- | ------------------------------------------------------------- | ------- |
| 1   | Api study of `part.create` | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |

**Task #1: Api study of `part.create`**

Creates a new part and returns its ID. The optional `name` parameter names it. This clears any existing drawing content.

```js
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'MyPart' })).result
  // ✓ partId → 4 (numeric ID, varies per session)
  return { partId }
}
```

---

### Category 2.2: Expressions & Parametric Control

**Essentials:** Expressions are named variables that drive feature parameters. `common.evaluateExpression` is the standalone math engine. `part.expression` creates named variables inside a part. To use a named expression in a feature parameter, use the **`@expr.NAME`** syntax (e.g., `length: '@expr.width'`). Bare expression names do NOT work in feature params — `linkWithExpression` is a separate mechanism for programmatic binding. When you update an expression, all features referencing it via `@expr.` recalculate automatically. Learn this now because work geometry, sketches, and every feature type from here on can be expression-driven.

**Foundations:** The expression syntax is documented in [expressions.md](../knowledge/classcad-skill/references/api/expressions.md). Supports constants (`C:PI`), functions (`sin`, `sqrt`, `abs`), references to other expressions by name, and the `@expr.NAME` prefix for use in feature parameters. Formulas can combine `@expr.` refs with arithmetic (e.g., `'@expr.height + 10'`) and work inside string-encoded arrays (e.g., `'[@expr.x, 0, @expr.z]'`).

| #   | Task                                                                                          | Source                                                                    | Studied |
| --- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------- |
| 1   | Api study of `common.evaluateExpression` — standalone math evaluation                         | [common.md](../knowledge/classcad-skill/references/api/common.md)         | [✅]    |
| 2   | Api study of `part.expression` — create named expressions                                     | [part.md](../knowledge/classcad-skill/references/api/part.md)             | [✅]    |
| 3   | Api study of `part.getExpression`                                                             | [part.md](../knowledge/classcad-skill/references/api/part.md)             | [✅]    |
| 4   | Api study of `part.updateExpression`                                                          | [part.md](../knowledge/classcad-skill/references/api/part.md)             | [✅]    |
| 5   | Api study of `part.deleteExpression`                                                          | [part.md](../knowledge/classcad-skill/references/api/part.md)             | [✅]    |
| 6   | Api study of `part.renameExpression`                                                          | [part.md](../knowledge/classcad-skill/references/api/part.md)             | [✅]    |
| 7   | Api study of `part.linkWithExpression`                                                        | [part.md](../knowledge/classcad-skill/references/api/part.md)             | [✅]    |
| 8   | Api study of `part.unlinkExpression`                                                          | [part.md](../knowledge/classcad-skill/references/api/part.md)             | [✅]    |
| 9   | Study: expression syntax — constants, functions, inter-expression references                  | [expressions.md](../knowledge/classcad-skill/references/api/expressions.md) | [✅]    |
| 10  | Study: expression workflow — create → link to feature param → update → observe feature change | part.md                                                                   | [✅]    |

**Task #1: Api study of `common.evaluateExpression`**

Evaluates a math expression string. Supports ClassCAD constants like `C:PI`. Can optionally reference a part/assembly via `id`. The `silent` param suppresses error messages.

```js
export default async function (api) {
  const r1 = await api.v1.common.evaluateExpression({ expression: 'sin(C:PI/2)' })
  const r2 = await api.v1.common.evaluateExpression({ expression: '2+3*4' })
  const r3 = await api.v1.common.evaluateExpression({ expression: 'sqrt(144)' })
  // ✓ r1.result → 1, r2.result → 14, r3.result → 12
  return { sinPiOver2: r1.result, mathExpr: r2.result, sqrt144: r3.result }
}
```

**Task #2-5: Expression CRUD**

Expressions use `toCreate` array to batch-create, and `getExpression` to read back.

```js
// ...after part.create...
await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'width', value: 50 },
    { name: 'height', value: 'width * 0.6' },
  ],
})
// ✓ result → 1 (boolean true = success)

const val = (await api.v1.part.getExpression({ id: partId, name: 'height' })).result
// ✓ val → { expression: "width * 0.6", value: 30 }

await api.v1.part.updateExpression({ id: partId, name: 'width', value: '80' })
// After update + recalc, height becomes 48

// Use expressions in feature params with @expr. prefix
await api.v1.part.box({
  id: partId,
  length: '@expr.width',
  height: '@expr.height',
  width: '@expr.width / 2',
})
// Box dimensions are now driven by the expressions
// Updating 'width' will recalculate the box automatically
```

**Task #7-8: linkWithExpression / unlinkExpression (post-hoc binding)**

These APIs bind/unbind a named expression to a feature parameter **after** the feature was already created with a plain value. `linkWithExpression` takes the **feature ID** (not the part ID), the expression name, and the parameter name. `unlinkExpression` disconnects the binding — the parameter **freezes at the current expression value** (it does NOT revert to the original hard-coded value).

```js
// Box created with plain height=40
const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

// Later, bind height to expression H=120
await api.v1.part.linkWithExpression({ id: boxId, exprName: 'H', name: 'height' })
await api.v1.common.recalc() // box height is now 120

// Unbind — height freezes at 120 (NOT 40)
await api.v1.part.unlinkExpression({ id: boxId, name: 'height' })
await api.v1.common.recalc() // box height stays 120, changing H has no effect
```

---

### Category 2.3: Feature Editing Gate (openFeature / closeFeature)

**Essentials:** Before you can call ANY `update*` API on an existing feature, you must first open it with `part.openFeature`. After the update, you must close it with `part.closeFeature`. This is a hard requirement — update calls will fail without it. Learn this now because `update*` APIs appear throughout the rest of the plan.

| #   | Task                                                                                | Source                                                        | Studied |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------- |
| 1   | Api study of `part.openFeature`                                                     | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 2   | Api study of `part.closeFeature`                                                    | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 3   | Study: the open → update → close pattern — why it exists and what breaks without it | part.md                                                       | [✅]    |

**Task #1-2: Api study of `part.openFeature` / `part.closeFeature`**

Opens a feature for editing (sets the GhostRollbackBar), then closes it. Every `update*` call must be wrapped in this pattern.

```js
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'OpenCloseTest' })).result
  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP1', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0] }))
    .result

  // open → update → close
  await api.v1.part.openFeature({ id: wpId })
  await api.v1.part.updateWorkPlane({ id: wpId, origin: [0, 0, 100] })
  await api.v1.part.closeFeature({ id: wpId })

  // ✓ work plane now at z=100
  return { wpId }
}
```

---

### Category 2.4: Work Geometry

**Essentials:** Work geometry defines invisible construction references. Work planes are where sketches are drawn. Work axes define rotation centers. Work coordinate systems define local reference frames. Work points mark positions.

| #   | Task                                                                   | Source                                                        | Studied |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------- | ------- |
| 1   | Api study of `part.workPlane`                                          | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 2   | Api study of `part.updateWorkPlane`                                    | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 3   | Api study of `part.workAxis`                                           | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 4   | Api study of `part.updateWorkAxis`                                     | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 5   | Api study of `part.workCSys`                                           | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 6   | Api study of `part.updateWorkCSys`                                     | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 7   | Api study of `part.workPoint`                                          | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 8   | Api study of `part.updateWorkPoint`                                    | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 9   | Api study of `part.getWorkGeometry` — retrieving work geometry by name | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |

**Task #1-8: Work geometry creation**

Each work geometry type takes the part ID, a name, and positioning parameters. All return the feature ID of the created work geometry.

```js
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'WGTest' })).result

  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP1', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0] }))
    .result
  const waId = (await api.v1.part.workAxis({ id: partId, name: 'WA1', origin: [0, 0, 0], direction: [0, 1, 0] })).result
  const wcsId = (
    await api.v1.part.workCSys({ id: partId, name: 'WCS1', origin: [10, 20, 30], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })
  ).result
  const wptId = (await api.v1.part.workPoint({ id: partId, name: 'WPt1', position: [5, 5, 5] })).result

  // ✓ wpId → 54, waId → 62, wcsId → 70, wptId → 78
  return { wpId, waId, wcsId, wptId }
}
```

**Task #9: Api study of `part.getWorkGeometry`**

Retrieves a work geometry ID by name. Useful for finding default planes (XY, XZ, YZ) or named custom work geometry.

```js
// ...after part.create and workPlane creation...
const gwId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'WP1' })).result
// ✓ gwId → same as wpId (54)
```

---

### Category 2.5: Entity Injection

**Essentials:** An Entity Injection is a special feature that acts as a container for direct geometry (curves from Step 3, solids from Step 5). Created inside a part.

| #   | Task                                                                                 | Source                                                        | Studied |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ------- |
| 1   | Api study of `part.entityInjection`                                                  | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 2   | Study: relationship between entity injection IDs and curve/solid API `id` parameters | all docs                                                      | [✅]    |

**Task #1: Api study of `part.entityInjection`**

Creates an entity injection feature inside a part. The returned ID is what you pass as `id` to all `solid.*` and `curve.shape()` calls.

```js
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'EITest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  // ✓ eifId → 54 (this ID goes into solid.box({ id: eifId, ... }))
  return { partId, eifId }
}
```

---

### Category 2.6: Object Naming (first use)

| #   | Task                                | Source                                                            | Studied |
| --- | ----------------------------------- | ----------------------------------------------------------------- | ------- |
| 1   | Api study of `common.setObjectName` | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |

**Task #1: Api study of `common.setObjectName`**

Renames any object by ID. Now that we have parts and features, we can name them.

```js
// ...after creating an entity injection feature...
await api.v1.common.setObjectName({ id: eifId, name: 'RenamedEIF' })
// ✓ result → null (VOID)
```

---

## Step 3: 2D Curves & Shapes

**What you will learn:** Shape containers within entity injections, populated with 2D/3D curves. Lines, arcs, circles, ellipses, Bezier curves, polylines, the advanced polyline system, shape transforms, and 2D booleans.

**Prerequisites:** Step 2 (Parts & Entity Injection — you need an entity injection feature ID)

### Category 3.1: Shape Containers

**Essentials:** A Shape is a named container for curves, created inside an entity injection feature. All curve creation APIs require a shape ID.

| #   | Task                                                                     | Source                                                          | Studied |
| --- | ------------------------------------------------------------------------ | --------------------------------------------------------------- | ------- |
| 1   | Api study of `curve.shape`                                               | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |
| 2   | Api study of `curve.deleteShape`                                         | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |
| 3   | Api study of `curve.cleanShape` — deletes curves but keeps the container | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |

**Task #1: Api study of `curve.shape`**

Creates a shape container inside an entity injection. Returns the shape ID that all curve APIs require.

```js
// ...after part.create + entityInjection setup...
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'S1' })).result
// ✓ shapeId → 60
```

**Task #2-3:** `deleteShape({ ids: [shapeId1, shapeId2] })` removes shapes entirely. `cleanShape({ ids: [shapeId] })` deletes curves but keeps the empty container for reuse.

---

### Category 3.2: Basic Curves

| #   | Task                                     | Source                                                          | Studied |
| --- | ---------------------------------------- | --------------------------------------------------------------- | ------- |
| 1   | Api study of `curve.line`                | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |
| 2   | Api study of `curve.circle`              | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |
| 3   | Api study of `curve.arcBy3Points`        | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |
| 4   | Api study of `curve.arcByCenter`         | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |
| 5   | Api study of `curve.arcByCenterRadAngle` | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |

**Task #1-3: Basic curve creation**

All curve APIs take `id` = shape ID and return VOID. The curves are added to the shape.

```js
// ...after part + eif + shape setup...
await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
await api.v1.curve.circle({ id: shapeId, centerPos: [25, 25, 0], radius: 10 })
await api.v1.curve.arcBy3Points({ id: shapeId, startPos: [0, 50, 0], midPos: [25, 60, 0], endPos: [50, 50, 0] })
// ✓ all return null (VOID) — curves are added to the shape
```

**Task #4:** `arcByCenter` — arc defined by center, start, end, and clockwise flag: `{ id: shapeId, centerPos: [0,0,0], startPos: [10,0,0], endPos: [0,10,0], isClockwise: true }`

**Task #5:** `arcByCenterRadAngle` — arc by center, radius, and start/end angles (radians): `{ id: shapeId, centerPos: [0,0,0], startAngle: 0, endAngle: 1.57, radius: 5 }`

---

### Category 3.3: Advanced Curves

| #   | Task                                    | Source                                                          | Studied |
| --- | --------------------------------------- | --------------------------------------------------------------- | ------- |
| 1   | Api study of `curve.ellipse`            | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |
| 2   | Api study of `curve.ellipticArc`        | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |
| 3   | Api study of `curve.bezierCurve`        | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |
| 4   | Api study of `curve.interpolationCurve` | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |

**Task #1-4: Advanced curve types**

```js
// ...after part + eif setup...
const s1 = (await api.v1.curve.shape({ id: eifId, name: 'AdvCurves' })).result
await api.v1.curve.ellipse({ id: s1, centerPos: [0, 0, 0], radius1: 20, radius2: 10 })
await api.v1.curve.bezierCurve({
  id: s1,
  points: [
    [40, 0, 0],
    [45, 20, 0],
    [55, 20, 0],
    [60, 0, 0],
  ],
})
await api.v1.curve.interpolationCurve({
  id: s1,
  points: [
    [0, 40, 0],
    [10, 55, 0],
    [20, 40, 0],
    [30, 55, 0],
    [40, 40, 0],
  ],
})
// ✓ all return null — curves added to shape
```

---

### Category 3.4: Polylines

| #   | Task                                                                                                       | Source                                                          | Studied |
| --- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------- |
| 1   | Api study of `curve.polyline2d` — points + bulges                                                          | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |
| 2   | Api study of `curve.advancedPolyline` — PLD system                                                         | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |
| 3   | Study: bulge values — `tan(a/4)`, 0=line, 1=semicircle, negative=clockwise                                 | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |
| 4   | Study: advanced polyline PLD modes — `xa/ya` vs `xr/yr` vs `l/a` vs `l/ar`, radius `r`, chamfer `c`, close | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |

**Task #1: Api study of `curve.polyline2d`**

Points + optional bulges (arc control per segment). `close: true` connects last point to first.

```js
// ...after setup...
const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Poly' })).result
await api.v1.curve.polyline2d({
  id: s2,
  points: [
    [0, 0, 0],
    [20, 0, 0],
    [20, 20, 0],
    [0, 20, 0],
  ],
  bulges: [0, 0.414, 0, 0], // 0.414 ≈ tan(π/8) → 90° arc on 2nd segment
  close: true,
})
// ✓ result → null
```

**Task #2: Api study of `curve.advancedPolyline`**

The PLD (PointLineDefinition) system — absolute coords (`xa/ya`), relative (`xr/yr`), angle+length (`l/a`), radius fillet (`r`), chamfer (`c`), and `close`.

```js
const s3 = (await api.v1.curve.shape({ id: eifId, name: 'AdvPoly' })).result
await api.v1.curve.advancedPolyline({
  id: s3,
  pld: [
    { xa: 0, ya: 0 }, // start at absolute (0,0)
    { xa: 30, ya: 0, r: 5 }, // to (30,0) with 5mm radius fillet
    { xa: 30, ya: 20, r: 5 }, // to (30,20) with fillet
    { xa: 0, ya: 20 }, // to (0,20)
  ],
  close: true,
})
// ✓ result → null — closed rounded rectangle
```

---

### Category 3.5: Shape Transformations

| #   | Task                                                                      | Source                                                          | Studied |
| --- | ------------------------------------------------------------------------- | --------------------------------------------------------------- | ------- |
| 1   | Api study of `curve.translateShape`                                       | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |
| 2   | Api study of `curve.rotateShape`                                          | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |
| 3   | Api study of `curve.transformShape` — 4x4 matrix (orthogonal, no scaling) | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |
| 4   | Api study of `curve.scaleShape`                                           | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |

**Task #1-4: Shape transforms**

```js
// ...after creating a shape with curves...
await api.v1.curve.translateShape({ id: shapeId, translation: [25, 0, 0] })
await api.v1.curve.rotateShape({ id: shapeId, rotation: [0, 0, 1.57] }) // 90° around Z
await api.v1.curve.scaleShape({ id: shapeId, factor: 2.0 })
// transformShape needs orthogonal 4x4 matrix (no scaling in the matrix)
await api.v1.curve.transformShape({
  id: shapeId,
  matrix: [
    [0, 1, 0, 100],
    [-1, 0, 0, 50],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ],
})
```

---

### Category 3.6: 2D Boolean Operations on Shapes

| #   | Task                                | Source                                                          | Studied |
| --- | ----------------------------------- | --------------------------------------------------------------- | ------- |
| 1   | Api study of `curve.union2d`        | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |
| 2   | Api study of `curve.subtraction2d`  | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |
| 3   | Api study of `curve.intersection2d` | [curve.md](../knowledge/classcad-skill/references/api/curve.md) | [✅]    |

**Task #1-3: 2D booleans**

Operate on two closed shapes. `target` is modified, `tool` is consumed (unless `keepShape: true`).

```js
// ...after creating two overlapping closed shapes s1 and s2...
await api.v1.curve.union2d({ target: s1, tool: s2 })
// ✓ result → null — s1 now contains the union, s2 is consumed
// For subtraction/intersection: same pattern
// await api.v1.curve.subtraction2d({ target: s1, tool: s2, keepShape: true })
```

---

## Step 4: Constrained Sketches

**What you will learn:** The sketch system — constraint-driven 2D geometry with geometric constraints, dimensional constraints, regions, patterns, reference geometry, and parametric updates.

**Prerequisites:** Step 2 (Parts — sketches live inside parts on work planes)

### Category 4.1: Sketch Lifecycle

| #   | Task                                                    | Source                                                            | Studied |
| --- | ------------------------------------------------------- | ----------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.create`                            | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 2   | Api study of `sketch.setWorkPlane`                      | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 3   | Api study of `sketch.deleteSketch`                      | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 4   | Api study of `part.sketch` — creating from part context | [part.md](../knowledge/classcad-skill/references/api/part.md)     | [✅]    |
| 5   | Api study of `part.getSketch`                           | [part.md](../knowledge/classcad-skill/references/api/part.md)     | [✅]    |

**Task #1: Api study of `sketch.create`**

Creates a sketch inside a part. Returns the sketch ID. By default placed on XY plane.

```js
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  // ✓ skId → 52
  return { partId, skId }
}
```

**Task #4: Api study of `part.sketch`**

Alternative way to create a sketch — from the part API. Returns sketch ID.

```js
const skId = (await api.v1.part.sketch({ id: partId, name: 'Sk1' })).result
// ✓ skId → 89
```

---

### Category 4.2: Basic Sketch Geometry

| #   | Task                                                                  | Source                                                            | Studied |
| --- | --------------------------------------------------------------------- | ----------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.point`                                           | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 2   | Api study of `sketch.line`                                            | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 3   | Api study of `sketch.circle`                                          | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 4   | Api study of `sketch.arcByCenter`                                     | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 5   | Api study of `sketch.arcBy3Points`                                    | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 6   | Api study of `sketch.rectangle`                                       | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 7   | Api study of `sketch.geometry` — generic multi-type geometry creation | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |

**Task #2: Api study of `sketch.line`**

Creates a line in the sketch. Returns the line's sketch-curve ID.

```js
// ...after sketch.create...
const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
// ✓ lineId → 58
```

**Task #6: Api study of `sketch.rectangle`**

Creates 4 lines forming a rectangle. Returns an array of 4 sketch-curve IDs.

```js
const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0] })).result
// ✓ rectIds → [58, 64, 70, 76] (four line IDs)
```

---

### Category 4.3: Geometric Constraints

> **⚠️ RETRAIN REQUIRED:** Categories 4.3 and 4.4 were trained with sketches missing `planeId`, which silently disables the constraint solver. All solver-related findings (e.g., "constraints never reposition geometry") are **wrong**. With an explicit `planeId` (e.g., the standard Top plane), `updateDimension` returns `result: 1` (solved) and geometry moves. These tasks must be retrained with `planeId` set. See `references/sketch/create.md` for details.

| #   | Task                                                                                                                            | Source                                                            | Studied |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.constraint` — all constraint types                                                                         | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 2   | Api study of `sketch.generateAutoConstraints`                                                                                   | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 3   | Study: constraint types — coincident, parallel, perpendicular, tangent, equal, horizontal, vertical, symmetric, fixed, midpoint | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |

**Task #1:** Study the `constraint` API and all its type variants in the reference docs. This requires careful reading of parameter structures per constraint type.

---

### Category 4.4: Dimensional Constraints

| #   | Task                                                                                                      | Source                                                            | Studied |
| --- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.dimension`                                                                           | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 2   | Api study of `sketch.updateDimension`                                                                     | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 3   | Api study of `sketch.updateDimensionPosition`                                                             | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 4   | Study: dimension types — RADIUS, DIAMETER, OFFSET, HORIZONTAL_DISTANCE, VERTICAL_DISTANCE, ANGLE, ANGLEOX | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |

**Task #1: Api study of `sketch.dimension`**

Creates a dimension. Requires `type` and `geomIds` (the sketch curve IDs to dimension).

```js
// ...after creating a rectangle...
const dimId = (await api.v1.sketch.dimension({ id: skId, type: 'OFFSET', geomIds: [rectIds[0]] })).result
// ✓ dimId → 94
```

---

### Category 4.5: Sketch Regions

| #   | Task                                     | Source                                                            | Studied |
| --- | ---------------------------------------- | ----------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.sketchRegion`       | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 2   | Api study of `sketch.updateSketchRegion` | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 3   | Api study of `sketch.getSketchRegion`    | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 4   | Api study of `part.getSketchRegion`      | [part.md](../knowledge/classcad-skill/references/api/part.md)     | [✅]    |

**Task #1: Api study of `sketch.sketchRegion`**

Creates a closed region from sketch curves. The `geomIds` array must form a closed profile. Region IDs are what extrusion/revolve features consume.

```js
// ...after creating a rectangle [58,64,70,76]...
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
// ✓ regionId → 92
```

---

### Category 4.6: Updating & Querying Sketch Geometry

| #   | Task                                                       | Source                                                            | Studied |
| --- | ---------------------------------------------------------- | ----------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.updateGeometry`                       | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 2   | Api study of `sketch.getGeometry`                          | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 3   | Api study of `sketch.getPoints` — get point IDs of a curve | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 4   | Api study of `sketch.getPositions`                         | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 5   | Api study of `sketch.moveGeometry`                         | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |

**Task #2: Api study of `sketch.getGeometry`**

Returns all geometry IDs grouped by type from a sketch.

```js
const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
// ✓ geo → { arcs: [], circles: [95], lines: [], points: [] }
```

**Task #3: Api study of `sketch.getPoints`**

Returns start/end point IDs of a sketch curve. The `id` param must be a sketch-curve ID (not the sketch ID).

```js
const pts = (await api.v1.sketch.getPoints({ id: rectIds[0] })).result
// ✓ pts → { startId: 59, endId: 60 }
```

---

### Category 4.7: Reference Geometry

| #   | Task                                          | Source                                                            | Studied |
| --- | --------------------------------------------- | ----------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.referenceGeometry`       | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 2   | Api study of `sketch.changeReferenceGeometry` | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 3   | Api study of `sketch.unlinkReferenceGeometry` | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 4   | Api study of `sketch.setReferences`           | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |

**Task #1-4:** Reference geometry projects 3D edges/faces into a sketch for constraining. Study the docs for parameter details — these require existing 3D geometry from prior features.

---

### Category 4.8: Patterns & Rigid Sets

| #   | Task                                  | Source                                                            | Studied |
| --- | ------------------------------------- | ----------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.rigidSet`        | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 2   | Api study of `sketch.linearPattern`   | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 3   | Api study of `sketch.circularPattern` | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 4   | Api study of `sketch.mirrorPattern`   | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |

---

### Category 4.9: Sketch Fillets

| #   | Task                             | Source                                                            | Studied |
| --- | -------------------------------- | ----------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.fillet`     | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 2   | Api study of `sketch.undoFillet` | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |

---

### Category 4.10: Trimming, Splitting & Curve Management

> **⚠️ RETRAIN REQUIRED:** The split/trim APIs were renamed. Deprecated → replacement:
> `splitCurves` → `splitCurve`, `splitAllCurves` → `preTrim`, `trimCurves` → `trim`,
> `splitCurvesMergeBack` → `postTrim`. The new model is a standalone `splitCurve` plus a
> three-step `preTrim` → `trim` → `postTrim` workflow. Retrain against the new APIs;
> source guide: `~/Downloads/sketch-split-trim-guide.md`.

| #   | Task                               | Source                                                            | Studied |
| --- | ---------------------------------- | ----------------------------------------------------------------- | ------- |
| 1   | Api study of `sketch.splitCurve`   | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 2   | Api study of `sketch.preTrim`      | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 3   | Api study of `sketch.trim`         | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 4   | Api study of `sketch.postTrim`     | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 5   | Api study of `sketch.copyGeometry` | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 6   | Api study of `sketch.copyFrom`     | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 7   | Api study of `sketch.loadFrom`     | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [✅]    |
| 8   | Api study of `sketch.deleteObject` | [sketch.md](../knowledge/classcad-skill/references/api/sketch.md) | [ ]     |

---

## Step 5: 3D Solids (Direct Operations)

**What you will learn:** Creating and manipulating 3D solid bodies directly within entity injection features — primitives, extrusion/revolve from profiles, booleans, transforms, and specialized operations.

**Prerequisites:** Step 2 (Entity Injection), Step 3 or 4 (profiles for extrusion/revolve)

### Category 5.1: Primitive Solids

| #   | Task                                                                | Source                                                          | Studied |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------------- | ------- |
| 1   | Api study of `solid.box`                                            | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |
| 2   | Api study of `solid.sphere`                                         | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |
| 3   | Api study of `solid.cylinder`                                       | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |
| 4   | Api study of `solid.cone`                                           | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |
| 5   | Study: common parameters — `rotation`, `translation`, `rotateFirst` | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |

**Task #1-4: Primitive solids**

All primitives take `id` = entity injection feature ID. They return the created solid's ID. Optional `translation` and `rotation` position the solid.

```js
export default async function (api, { snapshot }) {
  // ...after part + entityInjection setup...
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 15, translation: [60, 0, 0] })).result
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 30, diameter: 20, translation: [0, 60, 0] })).result
  const coneId = (await api.v1.solid.cone({ id: eifId, height: 25, bDiameter: 20, tDiameter: 5, translation: [60, 60, 0] })).result
  // ✓ boxId → 61, sphId → 63, cylId → 67, coneId → 70
  await snapshot('solid-primitives')
  return { boxId, sphId, cylId, coneId }
}
```

---

### Category 5.2: Profile-Based Solids

| #   | Task                                                                          | Source                                                          | Studied |
| --- | ----------------------------------------------------------------------------- | --------------------------------------------------------------- | ------- |
| 1   | Api study of `solid.extrusion`                                                | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |
| 2   | Api study of `solid.revolve`                                                  | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |
| 3   | Study: how `curves` parameter works — shape ID vs array of sketch element IDs | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |

**Task #1-2: Extrusion + revolve from curve shapes**

```js
// Extrusion — sweep a closed profile along direction vector
const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Profile' })).result
await api.v1.curve.advancedPolyline({
  id: s1,
  pld: [
    { xa: 0, ya: 0 },
    { xa: 30, ya: 0 },
    { xa: 30, ya: 20 },
    { xa: 0, ya: 20 },
  ],
  close: true,
})
const extId = (await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 40], curves: s1 })).result
// ✓ extId → 64

// Revolve — rotate profile around axis
const s2 = (await api.v1.curve.shape({ id: eifId, name: 'RevProfile' })).result
await api.v1.curve.advancedPolyline({
  id: s2,
  pld: [
    { xa: 50, ya: 0 },
    { xa: 65, ya: 0 },
    { xa: 65, ya: 15 },
    { xa: 50, ya: 15 },
  ],
  close: true,
})
const revId = (await api.v1.solid.revolve({ id: eifId, originPos: [50, 0, 0], direction: [0, 1, 0], angle: 6.283, curves: s2 })).result
// ✓ revId → 70 (full 360° revolve = torus-like shape)
```

---

### Category 5.3: Boolean Operations

| #   | Task                                                           | Source                                                          | Studied |
| --- | -------------------------------------------------------------- | --------------------------------------------------------------- | ------- |
| 1   | Api study of `solid.union`                                     | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |
| 2   | Api study of `solid.subtraction`                               | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |
| 3   | Api study of `solid.intersection`                              | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |
| 4   | Api study of `solid.merge` — NOT a union                       | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |
| 5   | Study: target/tools pattern — `target`, `tools[]`, `keepTools` | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |

**Task #1-2: Union + subtraction**

`target` is the base solid (modified in place). `tools` are consumed (unless `keepTools: true`).

```js
// ...after creating two overlapping boxes b1 and b2...
await api.v1.solid.union({ id: eifId, target: b1, tools: [b2] })
// ✓ result → b1 ID (b2 consumed into b1)

// Subtract a cylinder from the result
const cyl = (await api.v1.solid.cylinder({ id: eifId, height: 60, diameter: 15, translation: [20, 20, -5] })).result
await api.v1.solid.subtraction({ id: eifId, target: b1, tools: [cyl] })
// ✓ result → b1 ID (cylinder hole cut through)
```

---

### Category 5.4: Solid Transformations

| #   | Task                             | Source                                                          | Studied |
| --- | -------------------------------- | --------------------------------------------------------------- | ------- |
| 1   | Api study of `solid.translation` | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |
| 2   | Api study of `solid.rotation`    | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |
| 3   | Api study of `solid.scale`       | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |
| 4   | Api study of `solid.mirror`      | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |

**Task #1-2: Translation + rotation**

```js
// ...after creating a box...
await api.v1.solid.translation({ id: eifId, target: boxId, translation: [50, 0, 0] })
await api.v1.solid.rotation({ id: eifId, target: box2Id, rotation: [0, 0, 0.785] }) // 45° around Z
// ✓ both return the solid ID
```

---

### Category 5.5: Cutting, Sectioning & Edge Operations

| #   | Task                                                  | Source                                                          | Studied |
| --- | ----------------------------------------------------- | --------------------------------------------------------------- | ------- |
| 1   | Api study of `solid.offset` — fragile, use with care  | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |
| 2   | Api study of `solid.slice` — cut at plane             | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |
| 3   | Api study of `solid.section` — cross-section curves   | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |
| 4   | Api study of `solid.fillet` — fillet at brep edge IDs | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |

**Task #2-4:** Slice, section, and fillet require careful edge/face ID selection. Study the docs for the exact patterns.

---

### Category 5.6: Solid Management

| #   | Task                                                              | Source                                                          | Studied |
| --- | ----------------------------------------------------------------- | --------------------------------------------------------------- | ------- |
| 1   | Api study of `solid.copy`                                         | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |
| 2   | Api study of `solid.deleteSolid`                                  | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |
| 3   | Api study of `solid.useSolid` — access solids from other features | [solid.md](../knowledge/classcad-skill/references/api/solid.md) | [✅]    |

**Task #1: Api study of `solid.copy`**

Copies a solid with optional translation/rotation.

```js
const copyId = (await api.v1.solid.copy({ id: eifId, target: boxId, translation: [0, 60, 0] })).result
// ✓ copyId → 63
```

---

## Step 6: Drawing Management & Object Properties

**What you will learn:** Now that you have real geometry, you can meaningfully use: saving/loading, clearing, recalculating, appearance, faceting, user metadata, coordinate systems, and matrix transforms.

**Prerequisites:** Step 5 (you need geometry for these to be meaningful)

### Category 6.1: Persistence — Save, Load, Clear

| #   | Task                                                           | Source                                                            | Studied |
| --- | -------------------------------------------------------------- | ----------------------------------------------------------------- | ------- |
| 1   | Api study of `common.save`                                     | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |
| 2   | Api study of `common.load`                                     | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |
| 3   | Api study of `common.clear`                                    | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |
| 4   | Api study of `common.recalc`                                   | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |
| 5   | Study: format comparison — OFB vs STP vs STL vs DXF            | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |
| 6   | Study: encoding/compression pipeline — data ↔ deflate ↔ base64 | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |

**Task #1-4: Save/load/clear/recalc cycle**

```js
export default async function (api) {
  // ...after creating part + entityInjection + solid.box...
  // Save to OFB as base64 data
  const saveRes = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result
  // ✓ saveRes.content → "AQJjbGFzc2NhZAIB..." (base64 string)

  // Clear the drawing
  await api.v1.common.clear({})
  // ✓ drawing is now empty

  // Load back from saved data
  const loadRes = (await api.v1.common.load({ data: saveRes.content, format: 'OFB', encoding: 'base64' })).result
  // ✓ loadRes → { id: 4 } (root part ID)

  // Force recalculation
  await api.v1.common.recalc({})
  // ✓ result → null (VOID)
}
```

---

### Category 6.2: Appearance & Visualisation

| #   | Task                                       | Source                                                            | Studied |
| --- | ------------------------------------------ | ----------------------------------------------------------------- | ------- |
| 1   | Api study of `common.setAppearance`        | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |
| 2   | Api study of `common.requestVisualisation` | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |

**Task #1: Api study of `common.setAppearance`**

Sets color (RGB 0-255) and transparency (0-1) on a feature or specific solid indices.

```js
// ...after creating geometry...
await api.v1.common.setAppearance({ target: eifId, color: [255, 100, 0], transparency: 0.3 })
// ✓ result → null — feature now renders orange at 70% opacity
```

---

### Category 6.3: Faceting / Tessellation Control

| #   | Task                                                                        | Source                                                            | Studied |
| --- | --------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------- |
| 1   | Api study of `common.getDatabaseSettings`                                   | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |
| 2   | Api study of `common.setDatabaseSettings`                                   | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |
| 3   | Api study of `common.getFacetingParameters`                                 | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |
| 4   | Api study of `common.setFacetingParameters`                                 | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |
| 5   | Study: faceting concepts — chordHeightTol, angleTol, quality vs performance | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |

**Task #3-4: Faceting parameters**

```js
const fp = (await api.v1.common.getFacetingParameters({})).result
// ✓ fp → { angleTol: 0, chordHeightTol: 0.1 }

await api.v1.common.setFacetingParameters({ angleTol: 15, chordHeightTol: 0.2 })
// ✓ result → null — tessellation quality updated
```

---

### Category 6.4: Object Coordinate Systems & Transforms

| #   | Task                                            | Source                                                            | Studied |
| --- | ----------------------------------------------- | ----------------------------------------------------------------- | ------- |
| 1   | Api study of `common.setObjectCoordSystem`      | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |
| 2   | Api study of `common.transformObjectWithMatrix` | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |

---

### Category 6.5: User Data (Custom Metadata)

| #   | Task                                                                              | Source                                                            | Studied |
| --- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------- |
| 1   | Api study of `common.setUserData`                                                 | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |
| 2   | Api study of `common.getUserData`                                                 | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |
| 3   | Api study of `common.removeUserData`                                              | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |
| 4   | Api study of `common.clearUserData`                                               | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |
| 5   | Api study of `common.getUserDataKeys`                                             | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |
| 6   | Study: user data limitations — string keys/values only, not copied on duplication | [common.md](../knowledge/classcad-skill/references/api/common.md) | [✅]    |

**Task #1-5: User data CRUD**

String key-value store on any object. Not copied when objects are duplicated.

```js
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'UDTest' })).result

  await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
  const ud = (await api.v1.common.getUserData({ id: partId, key: 'material' })).result
  const keys = (await api.v1.common.getUserDataKeys({ id: partId })).result
  await api.v1.common.removeUserData({ id: partId, key: 'material' })
  const after = (await api.v1.common.getUserData({ id: partId, key: 'material', defaultValue: 'none' })).result
  // ✓ ud → "steel", keys → ["material"], after → "none"
  return { ud, keys, after }
}
```

---

## Step 7: Part Features (Parametric Modeling)

**What you will learn:** Feature-based parametric modeling — features maintain design history, support update APIs, and can be driven by expressions.

**Prerequisites:** Steps 4 (Sketches), 5 (Solids), 6 (Drawing Management)

### Category 7.1: Primitive Features

| #   | Task                                                                    | Source                                                        | Studied |
| --- | ----------------------------------------------------------------------- | ------------------------------------------------------------- | ------- |
| 1   | Api study of `part.box`                                                 | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 2   | Api study of `part.updateBox`                                           | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 3   | Api study of `part.cone`                                                | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 4   | Api study of `part.updateCone`                                          | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 5   | Api study of `part.cylinder`                                            | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 6   | Api study of `part.updateCylinder`                                      | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 7   | Api study of `part.sphere`                                              | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 8   | Api study of `part.updateSphere`                                        | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 9   | Study: `part.box` (feature) vs `solid.box` (direct) — when to use which | part.md, solid.md                                             | [✅]    |

**Task #1: Api study of `part.box`**

Creates a box as a parametric feature. Unlike `solid.box`, this lives in the feature tree and supports `updateBox`. Optional `references` positions via a work coordinate system.

```js
const partId = (await api.v1.part.create({ name: 'FeatTest' })).result
const boxFeat = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result
// ✓ boxFeat → 54 (feature ID in the design tree)
```

---

### Category 7.2: Profile-Based Features

| #   | Task                                | Source                                                        | Studied |
| --- | ----------------------------------- | ------------------------------------------------------------- | ------- |
| 1   | Api study of `part.extrusion`       | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 2   | Api study of `part.updateExtrusion` | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 3   | Api study of `part.revolve`         | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 4   | Api study of `part.updateRevolve`   | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 5   | Api study of `part.twist`           | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 6   | Api study of `part.updateTwist`     | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |

**Task #1: Api study of `part.extrusion`**

Feature-level extrusion from a sketch region. Key param: `references` = array of sketch region IDs. Types: UP, DOWN, SYMMETRIC, CUSTOM.

```js
// ...after creating part + box feature...
const skId = (await api.v1.part.sketch({ id: partId, name: 'Sk1' })).result
const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 20, 0], radius: 10 })).result
const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: [circleId] })).result

const extFeat = (
  await api.v1.part.extrusion({
    id: partId,
    name: 'Hole',
    references: [regionId],
    type: 'UP',
    limit2: 35,
  })
).result
// ✓ extFeat → 102 (extrusion feature ID)
```

---

### Category 7.3: Boolean & Cutting Features

| #   | Task                                     | Source                                                        | Studied |
| --- | ---------------------------------------- | ------------------------------------------------------------- | ------- |
| 1   | Api study of `part.boolean`              | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 2   | Api study of `part.updateBoolean`        | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 3   | Api study of `part.slice`                | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 4   | Api study of `part.updateSlice`          | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 5   | Api study of `part.sliceBySheet`         | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 6   | Api study of `part.updateSliceBySheet`   | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 7   | Api study of `part.entityDeletion`       | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 8   | Api study of `part.updateEntityDeletion` | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |

---

### Category 7.4: Edge Features (Chamfer & Fillet)

| #   | Task                              | Source                                                        | Studied |
| --- | --------------------------------- | ------------------------------------------------------------- | ------- |
| 1   | Api study of `part.chamfer`       | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 2   | Api study of `part.updateChamfer` | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 3   | Api study of `part.fillet`        | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 4   | Api study of `part.updateFillet`  | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |

**Task #3: Api study of `part.fillet`**

Creates a fillet feature. Param `references` = array of brep edge IDs (found via `getGeometryIds`).

```js
// ...after creating a box feature...
// First find the edge ID by providing a position ON the edge
const geoIds = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [30, 0, 30] }] })).result
// ✓ geoIds → { lines: [75], ... }

const filletFeat = (await api.v1.part.fillet({ id: partId, name: 'Fillet1', references: geoIds.lines, radius: 5 })).result
// ✓ filletFeat → 91
```

---

### Category 7.5: Mirror & Pattern Features

| #   | Task                                      | Source                                                        | Studied |
| --- | ----------------------------------------- | ------------------------------------------------------------- | ------- |
| 1   | Api study of `part.mirror`                | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 2   | Api study of `part.updateMirror`          | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 3   | Api study of `part.linearPattern`         | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 4   | Api study of `part.updateLinearPattern`   | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 5   | Api study of `part.circularPattern`       | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 6   | Api study of `part.updateCircularPattern` | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |

**Task #3: Api study of `part.linearPattern`**

Creates a linear pattern of features. Requires `targets` (feature IDs) and `dir1.references` (a work axis or two points defining the direction).

```js
// ...after creating a box feature + work axis...
const waId = (await api.v1.part.workAxis({ id: partId, name: 'PatAxis', origin: [0, 0, 0], direction: [1, 0, 0] })).result
const lpFeat = (
  await api.v1.part.linearPattern({
    id: partId,
    name: 'LP1',
    targets: [boxFeat],
    dir1: { references: [waId], distance: 30, count: 3 },
  })
).result
// ✓ lpFeat → 99
```

---

### Category 7.6: Transformation Features

| #   | Task                                           | Source                                                        | Studied |
| --- | ---------------------------------------------- | ------------------------------------------------------------- | ------- |
| 1   | Api study of `part.translation`                | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 2   | Api study of `part.updateTranslation`          | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 3   | Api study of `part.rotation`                   | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 4   | Api study of `part.updateRotation`             | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 5   | Api study of `part.transformationByCSys`       | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 6   | Api study of `part.updateTransformationByCSys` | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |

---

### Category 7.7: Import Features & Composite Curves

| #   | Task                                     | Source                                                        | Studied |
| --- | ---------------------------------------- | ------------------------------------------------------------- | ------- |
| 1   | Api study of `part.importFeature`        | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 2   | Api study of `part.updateImportFeature`  | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 3   | Api study of `part.compositeCurve`       | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 4   | Api study of `part.updateCompositeCurve` | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |

---

### Category 7.8: Feature Management & Design History

> **Note:** `openFeature`/`closeFeature` basics were covered in Category 2.3. This section covers advanced design-history operations that build on that foundation.

| #   | Task                                                                                                                    | Source                                                        | Studied |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------- |
| 1   | Api study of `part.operationMoveBefore`                                                                                 | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 2   | Api study of `part.operationMoveToEnd`                                                                                  | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 3   | Api study of `part.getFeature`                                                                                          | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 4   | Api study of `part.deleteFeature`                                                                                       | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 5   | Api study of `part.createUncommitedObject`                                                                              | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 6   | Study: RollbackBar vs GhostRollbackBar — how open/close enables mid-tree editing without destroying downstream features | part.md                                                       | [✅]    |

---

### Category 7.9: Appearance, Mass Properties & Geometry Queries

| #   | Task                                                                      | Source                                                        | Studied |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------- | ------- |
| 1   | Api study of `part.setAppearance`                                         | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 2   | Api study of `part.calculateMassProperties`                               | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 3   | Api study of `part.getGeometryIds`                                        | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 4   | Api study of `part.getGeometryPositions`                                  | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 5   | Api study of `part.getBrepGeometryIndex`                                  | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 6   | Api study of `part.getBrepGeometryByIndex`                                | [part.md](../knowledge/classcad-skill/references/api/part.md) | [✅]    |
| 7   | Study: brep geometry access pattern — finding edge IDs for chamfer/fillet | part.md                                                       | [✅]    |

**Task #3: Api study of `part.getGeometryIds`**

Finds brep geometry (edges, faces) by providing positions on or near them. Returns IDs grouped by type. The `id` param must be the **part** ID (not feature).

```js
const geoIds = (
  await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [30, 0, 30] }], // position ON the edge you want
  })
).result
// ✓ geoIds → { lines: [75], arcs: [], circles: [], ... }
```

---

## Step 8: Assemblies

**What you will learn:** Multi-part structures: template/instance paradigm, constraints (fastened through kinematic), patterns, gear/group relations, and constraint-driven motion.

**Prerequisites:** Step 7 (complete parts to assemble)

> **Reset on 2026-05-01.** All assembly tasks in this Step were trained against a renderer that ignored instance transforms — every instance was drawn at the template origin, so any spatial claim "verified" by snapshot was actually unchecked. The renderer was fixed, the LLM docs in `references/assembly/` were deleted, and every row here was reset to `[ ]`. When redoing these tasks, follow the new SOUL rule: **spatial claims require numeric proof** (`calculateMassProperties` for instance COG, `getGeometryPositions` for vertex coords). Snapshots support the work but never substitute for it. Use `snapshot('label', { view: 'top' })` etc. when iso is ambiguous.

### Spatial verification is a first-class deliverable for every assembly task

Every assembly task in this Step must **establish and evaluate instance positioning in space**, not just call the API and check return codes. The previous run did the latter and the spatial claims that landed in the LLM docs were never actually measured. Going forward, every session must:

1. **Pick reference points up front.** Before writing the test, decide _what spatial fact you're going to measure_. For a template, that's a vertex coordinate or COG of its geometry. For an instance, that's its world-space COG (which `calculateMassProperties({ id: instanceId })` returns in assembly coordinates) and/or a vertex of one of its solids re-projected through the instance transform. For a constraint, that's the _change_ in those positions before vs. after the constraint solves.
2. **Predict the numbers, then measure.** Write down what you expect (e.g., "instance with `transformation: [[100,0,0], ...]` should have COG x ≈ 100 + template's local COG.x"), then `filewrite` the actual `calculateMassProperties` results and compare. Mismatches are the most useful findings — they distinguish "the API does what the docs say" from "the API does something else, the docs are wrong."
3. **Verify across multiple instances.** A constraint that "aligns mate2 to mate1" must be tested with non-trivial mate1 positions (not both at origin). Otherwise the alignment is a vacuous identity. Place the owning instances at distinct, asymmetric translations before applying the constraint, then measure where each ends up.
4. **Use snapshots as a second opinion, not the verdict.** The renderer now correctly composes per-instance transforms (fixed 2026-05-01), so an iso snapshot is informative again — but a single iso snapshot can still hide motion along a viewer-aligned axis. When iso is ambiguous, take an additional `snapshot('label', { view: 'top' })` (or front/right) to expose the relevant axis. **Do not** declare an instance "in the right place" from a snapshot alone; cite a COG comparison.
5. **Journal the numbers.** Every assembly journal entry that makes a positioning claim must show the numeric evidence (COG before/after, or vertex coordinate, or the JSON dump of `getInstance` / `getFastened` / etc.) — not "the snapshot looks right." A reader who can't reproduce the spatial claim from the journal alone is reading an unverified claim.

This applies to every category in Step 8 — templates, instances, fastened, kinematic, gear/group, patterns, motion. The pattern from `scripts/verify-assembly-render.mjs` plus the assembly-instance script 04 (which used COG to verify `isLocal` semantics — the only session in the previous run that actually measured positions) are the templates to imitate.

### Category 8.1: Assembly Creation & Templates

| #   | Task                                        | Source                                                                | Studied |
| --- | ------------------------------------------- | --------------------------------------------------------------------- | ------- |
| 1   | Api study of `assembly.create`              | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 2   | Api study of `assembly.partTemplate`        | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 3   | Api study of `assembly.assemblyTemplate`    | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 4   | Api study of `assembly.getPartTemplate`     | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 5   | Api study of `assembly.getAssemblyTemplate` | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 6   | Api study of `assembly.deleteTemplate`      | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 7   | Api study of `assembly.convertToTemplate`   | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 8   | Study: template vs instance paradigm        | assembly.md                                                           | [✅]    |

**Task #1-2: Assembly + part template creation**

```js
const asmId = (await api.v1.assembly.create({})).result
// ✓ asmId → 12 (root assembly ID)

const tplId = (await api.v1.assembly.partTemplate({})).result
// ✓ tplId → 22 (part template — now in part context, build geometry here)

// Build geometry inside the template
const boxFeat = (await api.v1.part.box({ id: tplId, name: 'Box1', length: 40, width: 30, height: 20 })).result
const wcsId = (await api.v1.part.workCSys({ id: tplId, name: 'WCS1', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] }))
  .result

// Return to assembly context
await api.v1.assembly.setCurrentProduct({ id: asmId })
```

---

### Category 8.2: Instances

| #   | Task                                   | Source                                                                | Studied |
| --- | -------------------------------------- | --------------------------------------------------------------------- | ------- |
| 1   | Api study of `assembly.instance`       | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 2   | Api study of `assembly.getInstance`    | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 3   | Api study of `assembly.deleteInstance` | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |

**Task #1: Api study of `assembly.instance`**

Creates an instance of a template. Requires `productId` (template) and `ownerId` (assembly or sub-assembly). Optional `transformation` positions it.

```js
const inst1 = (
  await api.v1.assembly.instance({
    productId: tplId,
    ownerId: asmId,
    name: 'Inst1',
  })
).result
// ✓ inst1 → 113

const inst2 = (
  await api.v1.assembly.instance({
    productId: tplId,
    ownerId: asmId,
    name: 'Inst2',
    transformation: [
      [50, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
    ], // offset by 50 in X
  })
).result
// ✓ inst2 → 115
```

---

### Category 8.3: Basic Constraints (Fastened)

| #   | Task                                         | Source                                                                | Studied |
| --- | -------------------------------------------- | --------------------------------------------------------------------- | ------- |
| 1   | Api study of `assembly.fastened`             | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 2   | Api study of `assembly.updateFastened`       | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 3   | Api study of `assembly.getFastened`          | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 4   | Api study of `assembly.fastenedOrigin`       | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 5   | Api study of `assembly.updateFastenedOrigin` | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 6   | Api study of `assembly.getFastenedOrigin`    | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |

**Task #4: Api study of `assembly.fastenedOrigin`**

Locks an instance at the assembly origin. Requires `mate1` with `path` (array with instance ID) and `csys` (work coordinate system from the template).

```js
await api.v1.assembly.fastenedOrigin({
  id: asmId,
  instance: inst1,
  name: 'FO1',
  mate1: { path: [inst1], csys: wcsId },
})
// ✓ result → 121 (constraint ID)
```

---

### Category 8.4: Kinematic Constraints

| #   | Task                                      | Source                                                                | Studied |
| --- | ----------------------------------------- | --------------------------------------------------------------------- | ------- |
| 1   | Api study of `assembly.revolute`          | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 2   | Api study of `assembly.updateRevolute`    | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 3   | Api study of `assembly.getRevolute`       | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 4   | Api study of `assembly.cylindrical`       | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 5   | Api study of `assembly.updateCylindrical` | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 6   | Api study of `assembly.getCylindrical`    | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 7   | Api study of `assembly.planar`            | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 8   | Api study of `assembly.updatePlanar`      | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 9   | Api study of `assembly.getPlanar`         | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 10  | Api study of `assembly.parallel`          | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 11  | Api study of `assembly.updateParallel`    | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 12  | Api study of `assembly.getParallel`       | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 13  | Api study of `assembly.slider`            | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 14  | Api study of `assembly.updateSlider`      | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 15  | Api study of `assembly.getSlider`         | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 16  | Api study of `assembly.spherical`         | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 17  | Api study of `assembly.updateSpherical`   | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 18  | Api study of `assembly.getSpherical`      | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |

**Task #1-18:** All kinematic constraints follow the mate1/mate2 pattern. Study the specific DOF (degrees of freedom) each type provides. Requires careful reading of the assembly reference docs.

---

### Category 8.5: Relations (Gear & Group)

| #   | Task                                | Source                                                                | Studied |
| --- | ----------------------------------- | --------------------------------------------------------------------- | ------- |
| 1   | Api study of `assembly.gear`        | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 2   | Api study of `assembly.updateGear`  | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 3   | Api study of `assembly.getGear`     | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 4   | Api study of `assembly.group`       | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 5   | Api study of `assembly.updateGroup` | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 6   | Api study of `assembly.getGroup`    | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |

---

### Category 8.6: Constraint Management

| #   | Task                                            | Source                                                                | Studied |
| --- | ----------------------------------------------- | --------------------------------------------------------------------- | ------- |
| 1   | Api study of `assembly.deleteConstraint`        | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 2   | Api study of `assembly.update3DConstraintValue` | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |

---

### Category 8.7: Assembly Patterns

| #   | Task                                          | Source                                                                | Studied |
| --- | --------------------------------------------- | --------------------------------------------------------------------- | ------- |
| 1   | Api study of `assembly.linearPattern`         | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 2   | Api study of `assembly.updateLinearPattern`   | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 3   | Api study of `assembly.getLinearPattern`      | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 4   | Api study of `assembly.circularPattern`       | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 5   | Api study of `assembly.updateCircularPattern` | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 6   | Api study of `assembly.getCircularPattern`    | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |

---

### Category 8.8: Instance Transforms & Constraint-Driven Motion

| #   | Task                                                             | Source                                                                | Studied |
| --- | ---------------------------------------------------------------- | --------------------------------------------------------------------- | ------- |
| 1   | Api study of `assembly.transformInstance`                        | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 2   | Api study of `assembly.transformInstanceTo`                      | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 3   | Api study of `assembly.startMovingUnderConstraints`              | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 4   | Api study of `assembly.moveUnderConstraints`                     | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 5   | Api study of `assembly.finishMovingUnderConstraints`             | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 6   | Study: constraint-driven motion workflow — start → move → finish | assembly.md                                                           | [✅]    |

---

### Category 8.9: Assembly Management

| #   | Task                                               | Source                                                                | Studied |
| --- | -------------------------------------------------- | --------------------------------------------------------------------- | ------- |
| 1   | Api study of `assembly.setCurrentInstance`         | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 2   | Api study of `assembly.setCurrentProduct`          | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 3   | Api study of `assembly.setIdent`                   | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 4   | Api study of `assembly.from` — JSON/ECXML assembly | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [ ]     |
| 5   | Api study of `assembly.loadProduct`                | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 6   | Api study of `assembly.exportNode`                 | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 7   | Api study of `assembly.getWorkGeometry`            | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 8   | Api study of `assembly.calculateMassProperties`    | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |
| 9   | Api study of `assembly.createUncommitedObject`     | [assembly.md](../knowledge/classcad-skill/references/api/assembly.md) | [✅]    |

---

## Step 9: Technical Drawings (Drawing2D)

**What you will learn:** 2D projections of 3D models — creating views, adding dimensions, exporting to DXF/SVG.

**Prerequisites:** Step 7 or 8 (need 3D models)

### Category 9.1: View Creation & Layout

| #   | Task                                            | Source                                                                  | Studied |
| --- | ----------------------------------------------- | ----------------------------------------------------------------------- | ------- |
| 1   | Api study of `drawing2d.view`                   | [drawing2d.md](../knowledge/classcad-skill/references/api/drawing2d.md) | [✅]    |
| 2   | Api study of `drawing2d.centerView`             | [drawing2d.md](../knowledge/classcad-skill/references/api/drawing2d.md) | [✅]    |
| 3   | Api study of `drawing2d.placeView`              | [drawing2d.md](../knowledge/classcad-skill/references/api/drawing2d.md) | [✅]    |
| 4   | Api study of `drawing2d.getBoundaryBoxFromView` | [drawing2d.md](../knowledge/classcad-skill/references/api/drawing2d.md) | [✅]    |

**Task #1: Api study of `drawing2d.view`**

Creates 2D projections. `types` array defines which views (TOP, FRONT, RIGHT, LEFT, BOTTOM, BACK, ISO, etc.).

```js
// ...after creating a part with a box feature...
const viewIds = (
  await api.v1.drawing2d.view({
    id: partId,
    types: ['TOP', 'FRONT', 'ISO'],
  })
).result
// ✓ viewIds → [91, 101, 96] (one ID per view)
```

---

### Category 9.2: Dimensions

| #   | Task                                             | Source                                                                  | Studied |
| --- | ------------------------------------------------ | ----------------------------------------------------------------------- | ------- |
| 1   | Api study of `drawing2d.dimension`               | [drawing2d.md](../knowledge/classcad-skill/references/api/drawing2d.md) | [ ]     |
| 2   | Api study of `drawing2d.deleteDimension`         | [drawing2d.md](../knowledge/classcad-skill/references/api/drawing2d.md) | [ ]     |
| 3   | Api study of `drawing2d.updateDimensionPosition` | [drawing2d.md](../knowledge/classcad-skill/references/api/drawing2d.md) | [ ]     |

---

### Category 9.3: Export & Availability

| #   | Task                                    | Source                                                                  | Studied |
| --- | --------------------------------------- | ----------------------------------------------------------------------- | ------- |
| 1   | Api study of `drawing2d.exportDXF`      | [drawing2d.md](../knowledge/classcad-skill/references/api/drawing2d.md) | [ ]     |
| 2   | Api study of `drawing2d.exportSVG`      | [drawing2d.md](../knowledge/classcad-skill/references/api/drawing2d.md) | [ ]     |
| 3   | Api study of `drawing2d.isDXFAvailable` | [drawing2d.md](../knowledge/classcad-skill/references/api/drawing2d.md) | [ ]     |
| 4   | Api study of `drawing2d.isSVGAvailable` | [drawing2d.md](../knowledge/classcad-skill/references/api/drawing2d.md) | [ ]     |

**Task #3-4: Export availability checks**

```js
const dxfOk = (await api.v1.drawing2d.isDXFAvailable({})).result
const svgOk = (await api.v1.drawing2d.isSVGAvailable({})).result
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
