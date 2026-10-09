# Protocol Envelope

Every call returns an envelope. The docs describe `{ result, messages?, maxLevel? }`; the wire format has **5 keys**:

```js
{
  result:    any,          // payload — see Result Types
  messages:  Array,        // always an array ([] on success)
  maxLevel:  number,       // highest severity — 31 (info) is the clean baseline
  structure: object|null,  // scene graph — null inside run_script (MCP, buerli-ai): use api.tree()
  graphic:   object|null,  // rendering data — null inside run_script: use api.graphic()
}
```

## Result Types

| Doc type       | JS type    | Example                  | Notes                                   |
|----------------|------------|--------------------------|-----------------------------------------|
| `id`           | `number`   | `4`, `52`                | Positive integers, sequential with gaps |
| `Array<id>`    | `number[]` | `[58, 64, 70, 76]`       |                                         |
| `real`         | `number`   | `5`, `0.333`             | Full JS double precision                |
| `boolean`      | `number`   | `1`, `0`                 | NOT JS `true`/`false`                   |
| `string`       | `string`   | `""`, `"hello"`          | Full Unicode incl. emoji                |
| `VOID`         | `null`     | `null`                   | NOT undefined                           |
| `object`       | `object`   | `{ angleTol: 15, ... }`  | Boolean fields are `1`/`0`              |
| `point`        | `object`   | `{ x: 0, y: 0, z: 0 }`   |                                         |
| `Array<string>`| `string[]` | `["a", "b"]`             | Unordered                               |

- **`boolean`:** `1`/`0` everywhere — results, object fields, expressions. Expression constants are `TRUE`/`FALSE` (uppercase only).
- **`id`:** `Number.isInteger()` true. Monotonically increasing with variable gaps (part.create consumes ~50 IDs, box ~37). Accepted formats: [ID System](#id-system).
- **`point`:** parameters accept `[x, y, z]` or `{x, y, z}`; results, structure tree and expressions always return `{x, y, z}`. **Exactly 3 components** — `[x, y]`, `[x]`, `[x,y,z,w]`, `[]` fail: "If point is defined as array, it must have exactly 3 real values" (pass `z: 0` for sketch geometry). Full double precision (`0.000001`, `999999.999999` preserved). Direction vectors (e.g. `xVec`/`yVec` in `setObjectCoordSystem`) must be non-zero: "Vectors for SetCoordSystem may not have length 0".
- **`string`:** `getUserData` returns `""` for missing keys (no error) — indistinguishable from an empty value.
- **`VOID`:** all VOID APIs (`clear`, `setObjectName`, `setUserData`, …) return `null`.
- **Arrays:** empty results are `[]`, not `null`.
- **On error, `result` is always `null`**, whatever the declared return type.

## Error Detection

```js
const res = await api.v1.some.api({ ... })
if (res.maxLevel >= 51) { /* ERROR — result likely null, check messages */ }
```

| maxLevel | Meaning | Typical scenario |
|---|---|---|
| 31 | info | Clean success (baseline) |
| 41 | warning | Usually precedes an error (ToId warning before invalid ID) |
| 51 | error | Call failed — result is `null` |

Warning-only results exist: `evaluateExpression` with named expressions returns the correct value at maxLevel 41.

**`result === null` is NOT a failure indicator.** VOID APIs (`setObjectName`, `setAppearance`, `recalc`, …) return `null` on success, and `evaluateExpression` with `silent: true` returns `null` with maxLevel 31 on failure. Use `maxLevel`.

## Messages

```js
{ message: string, level: number /* 41=WARNING, 51=ERROR */, levelStr: string, code: number, api: string }
```

- `levelStr` is undocumented and inconsistent: `"WARNING"` for 41 in most APIs, `"WARN"` in `evaluateExpression`. Compare numeric `level`.
- `api` is sometimes missing (e.g. `evaluateExpression` errors, unknown command errors).
- One call can return several messages — typically a WARNING (41) then the ERROR (51), e.g. "couldn't convert to id" then "invalid id".

### Error Codes

| Code | Meaning | Example trigger |
|---|---|---|
| 0 | General/unclassified | Internal errors, ID-conversion warnings |
| 1001 | Wrong parameter type | String where boolean expected |
| 1003 | Empty parameter object | `param: {}` where non-empty expected |
| 1004 | Missing required parameter | Omitting `expression` from evaluateExpression |
| 1006 | Invalid ID | Nonexistent, float, or deleted ID |
| 1007 | Wrong ID type | Part ID where feature ID expected, vice versa |
| 1013 | Invalid parameter value | Invalid enum — message lists valid options |
| 1200 | Root already exists / not editable | Second `part.create`, or `update*` on locked feature |
| 1201 | Unknown command | Any non-existent API, e.g. `v1.common.doesNotExist` |

## Batch Envelope

See `common.batch`. Outer `messages` re-attribute job errors to `api: "v1.common.batch"`; successful jobs are `{ result }` only, failed ones carry the full envelope. Batch does not stop on error.

## Parameter Passing

`getAppVersion({})` and `getAppVersion()` both work. Extra/unknown parameters are silently ignored.

## Structure and Graphic Fields

- **`structure`:** the scene graph (every object's ID, name, class, parent, children, members). Inside `run_script` (MCP, buerli-ai) it is `null` on every call — read the model with `api.tree()`; outside a script (the training harness, an app's connection) every Result carries it. `structure.root` is the root product (the part; 1 while the drawing is empty), `structure.tree[String(id)]` any object. Shape: the `STRUCTURE` doc.
- **`graphic`:** tessellation data — `null` inside `run_script` (use `api.graphic()`), except on `common.requestVisualisation`, which always fills it. Shape: the `GRAPHICS` doc.

## Expression Engine

Functions, constants and numeric behaviour: `expression-syntax.md`. Additionally:

- `^` is not a power operator — it **silently returns null**. Use `pow(x, y)`.
- No `if`; comparison operators (`==`, `>`, `<`) do not work. String literals (`"hello"`) work.
- Only `C:PI`; `C:E`, `C:2PI`, `C:HALF_PI`, `C:INF` don't exist.
- **Degree suffix:** `180deg` → PI, `sin(90deg)` → 1. No `rad` suffix.
- **Points:** `{x, y, z}` literal (exactly 3 components; `{1,2}` / `{1,2,3,4}` → null). `{1,2,3}+{4,5,6}` → `{x:5,y:7,z:9}`; `{1,2,3}*2` → `{x:2,y:4,z:6}` (commutative).
- **Arrays:** `[1,2,3]`, nested `[[1,2],[3,4]]`, mixed `[{1,2,3},{4,5,6}]`.
- **Booleans:** `TRUE` → `1`, `FALSE` → `0` (lowercase not recognized); numeric: `TRUE + TRUE` → `2`, `TRUE * 5` → `5`.
- **`silent: true`** suppresses ALL messages on failure (`messages: []`, maxLevel 31, `result: null`) — indistinguishable from a VOID success. Avoid unless intended.

## Drawing Constraints

- **One root per drawing:** a second `part.create` fails with code 1200. `clear` first to start over.

<a name="id-system"></a>

## ID System

### ID Lifecycle

- **Creation:** single-object APIs return a number; multi-object APIs (e.g. `sketch.rectangle`) return `Array<number>`.
- **Consumption:** `common.*` APIs (`setObjectName`, `setUserData`, `transformObjectWithMatrix`) accept ANY valid object ID — parts, features, sketches, work planes, sketch elements, even internal objects like ExpressionSet.
- **Deletion:** `part.deleteFeature({ ids: [...] })` — deleted IDs are invalid immediately and never recycled.
- **Clear:** `common.clear()` invalidates all IDs; they restart from the same sequence (part.create → 4 again). `clear({ keepIds: [id] })` keeps the named objects with their IDs, but not the solid geometry inside them (part + EIF kept, mass properties afterwards fail).

### ID Validation

| Error | Meaning | Example |
|---|---|---|
| code 1006 | ID doesn't exist | Nonexistent, deleted, or float ID |
| code 1007 | ID exists but wrong class | Feature ID where part ID expected |
| code 1001 | Wrong param type | Lists valid types: `"Provide only following id types: [\"part\"]"` |
| ToId() warning (code 0) | Couldn't parse to ID | Precedes 1006 errors |

1001 is more helpful than 1007 (lists valid types); some APIs give 1007 without alternatives.

### ID Type Expectations

- **Create APIs** (`part.box`, `sketch.create`) take the **parent container ID** (typically the part).
- **Update APIs** (`updateBox`, `updateCylinder`) take the **feature ID** from the create call, and the feature must be "active and open" (code 1200 otherwise) — features are locked after creation and must be reopened (`part.openFeature`).

### Accepted ID Formats

| Format | Works? | Notes |
|---|---|---|
| `4` | ✓ | |
| `"4"` | ✓ | |
| `" 4 "` | ✓ | Whitespace trimmed |
| `"4.0"` | ✓ | Coerced to integer |
| `4.5` | ❌ | ToId() warning + code 1006 |
| `0`, `-1` | ❌ | Not a valid object |
| `null` | ❌ | code 1004 "must be provided" (feature creators) or 1001 "= VOID is not allowed" (e.g. `setUserData`, `setObjectName`) |
| `true` | ❌ | code 1007 |
| `{id: 4}` | ❌ | Internal VM error |
| `""` | ❌ | code 1004 |

String IDs work in `Array<id>` parameters too (`keepIds`, `requestVisualisation.ids`).

### Object Hierarchy

After `part.create`, ~24 objects exist:

```
AllObjects (1)
└── CC_Part (4) ← returned by part.create
    ├── CC_ExpressionSet (6)
    ├── CC_DimensionSet (8)
    ├── CC_GeometrySet (10)
    │   ├── CC_WorkPoint "Origin" (22)
    │   ├── CC_WorkAxis "XAxis" (26), "YAxis" (30), "ZAxis" (34)
    │   └── CC_WorkPlane "Top" (38), "Front" (42), "Right" (46)
    ├── CC_ReferenceSet (12)
    ├── CC_SketchSet (14)
    ├── CC_EntitySet (16)
    └── CC_OperationSequence (18)
        ├── Work geometry references (24, 28, 32, 36, 40, 44, 48)
        └── CC_RollbackBar (20)
```

Features are added under EntitySet; each also creates a CC_OperationReference under OperationSequence and a CC_Solid child.

### Batch and IDs

`common.batch` cannot forward IDs between jobs. `part.create` always returns 4 on a clean drawing, so that one can be hardcoded; otherwise use sequential calls.

## Coordinate System

Right-handed: **X** right (Right plane normal), **Y** forward (Front plane normal), **Z** up (Top plane normal). Default planes: Top (XY, Z-normal), Front (XZ, Y-normal), Right (YZ, X-normal).

## Angles

**All angles are radians** — revolve, twist, chamfer, circular patterns, rotation vectors, `workCSys` rotation, expression trig. The one exception: the tessellation `angleTol` (`setDatabaseSettings`, `setFacetingParameters`) is in degrees. No degree mode (expressions: `Ndeg` suffix). No `atan2` function — two-argument `atan(y, x)` is atan2 (`atan(1,-1)` = 2.356).

## Rotation Vectors

`rotation: [rx, ry, rz]` (`solid.box`, `solid.copy`, `part.workCSys`, …): rotation around each axis in radians — `[0, 0, PI/4]` = 45° about Z, `[PI/2, 0, 0]` = 90° about X. **`rotateFirst`** (default `TRUE`): with both `rotation` and `translation`, rotation is applied first; `FALSE` translates first.

## Transformation Matrix

`common.transformObjectWithMatrix` needs exactly 4×4 — 3×3 fails: "The provided matrix is not a 4x4 matrix". Translation in the last column:

```js
matrix: [
  [R00, R01, R02, Tx],
  [R10, R11, R12, Ty],
  [R20, R21, R22, Tz],
  [0,   0,   0,   1 ],
]
```

`isGlobal` (default `TRUE`): `TRUE` = matrix in global coordinates, `FALSE` = object's local system. It transforms the part's global coordinate system — internal geometry stays in local coordinates, and the structure tree shows local coordinates, so work axis directions do not visibly change. Matrices compose (same transform twice = double effect). More: `transformObjectWithMatrix.md`.

## Related

`common.batch` · `common.evaluateExpression` · `common.getAppVersion` / `common.getClassFileVersion` · `expression-syntax.md` · `STRUCTURE` / `GRAPHICS` / `DATA` (the data-contract docs)
