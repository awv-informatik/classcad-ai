# Protocol Envelope

Every ClassCAD API call returns a response envelope. The docs describe it as `{ result, messages?, maxLevel? }` but the actual wire format has **5 keys**:

```js
{
  result:     any,          // the payload — see Result Types below
  messages:   Array,        // always present, always an array (empty [] on success)
  maxLevel:   number,       // highest severity — 31 (info) is the baseline for clean calls
  structure:  object|null,  // full scene graph — ignore for API scripting
  graphic:    object|null,  // rendering data for clients — ignore for API scripting
}
```

## Result Types

| Doc type       | JS type    | Example                        | Notes                                        |
|----------------|------------|--------------------------------|----------------------------------------------|
| `id`           | `number`   | `4`, `52`                      | Positive integers, sequential with gaps      |
| `Array<id>`    | `number[]` | `[58, 64, 70, 76]`            | Array of integer IDs                         |
| `real`         | `number`   | `5`, `0.333`, `3.14159`        | Full JS double precision                     |
| `boolean`      | `number`   | `1`, `0`                       | NOT JS `true`/`false` — always `1` or `0`    |
| `string`       | `string`   | `""`, `"hello"`                | Full Unicode support including emoji          |
| `VOID`         | `null`     | `null`                         | NOT undefined — always `null`                |
| `object`       | `object`   | `{ angleTol: 15, ... }`       | Plain JS object; boolean fields are `1`/`0`  |
| `point`        | `object`   | `{ x: 0, y: 0, z: 0 }`       | Object with x/y/z keys                       |
| `Array<string>`| `string[]` | `["a", "b"]`                   | Plain JS string array, unordered             |

### Type details

**`boolean`:** Universally `1`/`0` numbers — in API results, object fields, and expressions. Never JS `true`/`false`. Expression constants are `TRUE`/`FALSE` (uppercase only; lowercase `true`/`false` are not recognized).

**`id`:** Positive integers (`typeof === 'number'`, `Number.isInteger() === true`). IDs are monotonically increasing with variable gaps — each creation allocates internal child objects, so gaps depend on the object type (part.create consumes ~50 IDs, box ~37). As parameters, IDs accept numbers and string-encoded numbers (`4`, `"4"`, `" 4 "`, even `"4.0"` all work — the parser trims whitespace and coerces float strings). Float numbers (4.5), zero, negative, null, booleans, empty strings, and JS objects all fail. See [ID System](#id-system) for full details.

**`point`:** Two representations exist:
- **API parameters** accept BOTH `[x, y, z]` arrays AND `{x, y, z}` objects (e.g. `startPos: [0, 0, 0]` or `startPos: {x: 0, y: 0, z: 0}`)
- **API results, structure tree, and expressions** always return `{x, y, z}` objects
- **Must be exactly 3 components.** `[x, y]`, `[x]`, `[x,y,z,w]`, and `[]` all fail with: "If point is defined as array, it must have exactly 3 real values". For sketch geometry on the XY plane, pass `z: 0` explicitly.
- **Full double precision** — values like `0.000001` and `999999.999999` are preserved exactly.
- **Direction vectors** (e.g. `xVec`, `yVec` in `setObjectCoordSystem`) must be non-zero. Zero vectors `[0,0,0]` fail: "Vectors for SetCoordSystem may not have length 0".

**`string`:** Full Unicode including emoji. `getUserData` returns `""` for missing keys (no error) — you cannot distinguish "key exists with empty value" from "key does not exist".

**`VOID`:** All VOID-returning APIs (`clear`, `setObjectName`, `setUserData`, etc.) return `null`.

**Empty arrays:** APIs returning `Array<*>` give `[]` for empty results, not `null`. But on error, result is `null` (not empty array).

**On error:** Result is **always `null`** regardless of declared return type — whether the API normally returns `id`, `boolean`, `Array`, `real`, or `VOID`.

## Error Detection

Check `maxLevel` to detect errors:

```js
const res = await api.v1.some.api({ ... })
if (res.maxLevel >= 51) {
  // ERROR — result is likely null, check messages for details
}
```

| maxLevel | Meaning     | Typical scenario                          |
|----------|-------------|-------------------------------------------|
| 31       | info        | Clean success (baseline for all calls)    |
| 41       | warning     | Precursor to error (always paired with 51)|
| 51       | error       | Call failed — result is `null`            |

In practice, `maxLevel == 31` means success, `maxLevel >= 51` means failure. Warning-only (41 without 51) was not observed in testing — warnings always accompany errors as precursors (e.g., the ToId warning before an invalid ID error).

**Caveat:** `result === null` is **NOT** a reliable failure indicator. VOID-returning APIs (`setObjectName`, `setAppearance`, `recalc`, etc.) return `null` on success. And `evaluateExpression` with `silent: true` returns `null` with `maxLevel: 31` on failure. Use `maxLevel` for failure detection, not result nullity.

## Messages

```js
{
  message:  string,   // human-readable error/warning text
  level:    number,   // severity: 41=WARNING, 51=ERROR
  levelStr: string,   // UNDOCUMENTED — "WARNING", "ERROR", etc.
  code:     number,   // error code (see table below)
  api:      string,   // INCONSISTENT — sometimes present, sometimes missing
}
```

**Undocumented field:** `levelStr` is always present but not in the API docs. **It is also inconsistent:** most APIs use `"WARNING"` for level 41, but `evaluateExpression` uses `"WARN"`. Always compare the numeric `level` field, never `levelStr`.

**Inconsistency:** The `api` field is sometimes omitted (e.g. on `evaluateExpression` errors and unknown command errors).

### Error Codes

| Code | Meaning                          | Example trigger                              |
|------|----------------------------------|----------------------------------------------|
| 0    | General/unclassified             | Internal errors, warnings about ID conversion|
| 1001 | Wrong parameter type             | String where boolean expected                |
| 1003 | Empty parameter object           | Passing `param: {}` where non-empty expected |
| 1004 | Missing required parameter       | Omitting `expression` from evaluateExpression|
| 1006 | Invalid ID                       | Nonexistent ID, float ID, already-deleted ID |
| 1007 | Wrong ID type                    | Part ID where feature ID expected, vice versa|
| 1013 | Invalid parameter value          | Invalid enum value — message lists valid options |
| 1200 | Root already exists / not editable | Second `part.create`, or `update*` on locked feature |
| 1201 | Unknown command                  | `v1.common.doesNotExist`, `sketch.isSolved`  |

**Multiple messages per call:** A single call can return multiple messages. Typically a WARNING (41) precedes the ERROR (51) — e.g. "couldn't convert to id" (warning) then "invalid id" (error).

## Batch Envelope

`v1.common.batch` wraps multiple calls. Its envelope structure differs:

**Outer envelope:**
- `result`: `Array` of inner envelopes (one per job)
- `messages`: bubbles up errors from any job, re-attributed to `api: "v1.common.batch"`
- `maxLevel`: highest severity across all jobs

**Inner envelopes (per job):**
- **Success:** `{ result }` only — NO `messages` or `maxLevel` keys
- **Failure:** `{ result, messages, maxLevel }` — full envelope

Batch does NOT stop on error. All jobs execute regardless of earlier failures.

## Parameter Passing

Pass params as `{ ... }` or `{}` for parameterless calls:

```js
// Good
await api.v1.common.getAppVersion({})
await api.v1.common.getAppVersion()
```

Extra/unknown parameters are silently ignored — no warning.

## Structure and Graphic Fields

**`structure`:** Full scene graph of the drawing — every object with ID, name, class, parent, children, and members. Updated after every call that modifies the drawing. Massive. Agents should ignore it and use `result` instead.

**`graphic`:** Rendering/tessellation data for client applications. Usually `null` in API scripting contexts.

## Expression Engine

`evaluateExpression` supports a rich expression language:

**Arithmetic:** `+`, `-`, `*`, `/` work on reals. Use `pow(x, y)` for exponentiation — `^` is **NOT** a power operator (silently returns null).

**Available functions:**

| Category | Functions | Notes |
|----------|-----------|-------|
| Trig | `sin`, `cos`, `tan`, `asin`, `acos`, `atan` | All radians. **`atan2` does NOT exist.** |
| Math | `sqrt`, `pow(x,y)`, `abs`, `exp` | `pow` is the only way to exponentiate |
| Logarithmic | `log` (base 10), `ln` (natural) | `log(100)` → `2`, `ln(exp(1))` → `1` |
| Min/Max | `min(a,b)`, `max(a,b)` | Work on reals |
| **Missing** | `floor`, `ceil`, `round`, `mod`, `atan2`, `if` | None of these exist |

**Constants:** Only `C:PI` (3.14159...). `C:E`, `C:2PI`, `C:HALF_PI`, `C:INF` do **NOT** exist. Use `exp(1)` for Euler's number.

**Degree suffix:** `Ndeg` converts degrees to radians in expressions: `180deg` → PI, `sin(90deg)` → 1. No `rad` suffix (angles are already radians).

**Points:** Literal syntax `{x, y, z}` (curly braces, exactly 3 components). Returns `{x, y, z}` object.
- Point arithmetic: `{1,2,3}+{4,5,6}` → `{x:5,y:7,z:9}`
- Scalar multiplication: `{1,2,3}*2` → `{x:2,y:4,z:6}` (commutative)
- `{1,2}` or `{1,2,3,4}` → null (must be exactly 3 components)

**Arrays:** `[1,2,3]` syntax, supports nesting `[[1,2],[3,4]]` and mixed types `[{1,2,3},{4,5,6}]`.

**Booleans:** `TRUE` → `1`, `FALSE` → `0` (uppercase only). Booleans are numeric — `TRUE + TRUE` → `2`, `TRUE * 5` → `5`. Comparison operators (`==`, `>`, `<`) do NOT work. String literals (`"hello"`) are supported.

**`silent` mode:** `evaluateExpression({ expression, silent: true })` suppresses ALL messages on failure — `messages: []`, `maxLevel: 31`, `result: null`. The expression still fails but the failure is invisible. There is no way to distinguish a silent failure from a VOID success. Avoid `silent: true` unless you intentionally want to suppress errors.

## Drawing Constraints

- **One root per drawing:** Only one `part.create` or `assembly.create` per drawing. Second call fails with code 1200. Must `clear` first to start over.

<a name="id-system"></a>

## ID System

Every object in ClassCAD has a unique integer ID. IDs are the primary mechanism for referencing objects across API calls.

### ID Lifecycle

- **Creation:** APIs like `part.create`, `part.box`, `sketch.create`, `sketch.line` return IDs. Single-object APIs return a number; multi-object APIs (e.g. `sketch.rectangle`) return `Array<number>`.
- **Consumption:** Most APIs take an `id` parameter to identify which object to operate on. The `common.*` APIs (`setObjectName`, `setUserData`, `transformObjectWithMatrix`) accept ANY valid object ID regardless of class.
- **Deletion:** `part.deleteFeature({ ids: [...] })` removes features. Deleted IDs become invalid immediately and are never recycled.
- **Clear:** `common.clear()` invalidates ALL IDs. IDs restart from the same sequence (part.create → 4 again). `clear({ keepIds: [id] })` preserves the named object AND its entire subtree — all children, features, and solids survive with their original IDs.

### ID Validation

APIs validate both existence and class of IDs:

| Error | Meaning | Example |
|-------|---------|---------|
| code 1006 | ID doesn't exist | Nonexistent, deleted, or float ID |
| code 1007 | ID exists but wrong class | Feature ID where part ID expected |
| code 1001 | Wrong param type (helpful) | Lists valid types: `"Provide only following id types: [\"part\"]"` |
| ToId() warning (code 0) | Couldn't parse to ID | Precedes 1006 errors; indicates the value failed internal conversion |

**Error 1001 is more helpful than 1007** — it lists the valid ID types for that parameter. Not all APIs use 1001; some give 1007 without listing alternatives.

### ID Type Expectations

**Create APIs** (e.g. `part.box`, `sketch.create`) expect the **parent container ID** — typically a part ID. The `id` parameter is "where to create this thing."

**Update APIs** (e.g. `updateBox`, `updateCylinder`) expect the **feature ID** — the ID returned from the corresponding create call. **Warning:** update APIs also require the feature to be "active and open" (code 1200 if not). Features become locked after creation; they must be explicitly reopened for editing (parametric modeling concept — covered in Step 7).

**Common APIs** (`setObjectName`, `setUserData`, `transformObjectWithMatrix`) are polymorphic — they accept any valid object ID: parts, features, sketches, work planes, sketch elements, even internal objects like ExpressionSet.

### Accepted ID Formats

| Format | Works? | Notes |
|--------|--------|-------|
| `4` (integer) | ✓ | Standard usage |
| `"4"` (string) | ✓ | String-encoded integer |
| `" 4 "` (padded string) | ✓ | Whitespace trimmed |
| `"4.0"` (float string) | ✓ | Coerced to integer |
| `4.5` (float number) | ❌ | ToId() warning + code 1006 |
| `0` | ❌ | Not a valid object |
| `-1` | ❌ | Not a valid object |
| `null` | ❌ | code 1004 "must be provided" |
| `true` | ❌ | code 1007 |
| `{id: 4}` (object) | ❌ | Internal VM error |
| `""` (empty string) | ❌ | code 1004 |

String IDs work in `Array<id>` parameters too (e.g. `keepIds`, `requestVisualisation.ids`).

### Object Hierarchy

After `part.create`, ~24 objects exist in a tree:

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

Features (box, cylinder, etc.) are added under EntitySet. Each feature also creates a CC_OperationReference under OperationSequence and a CC_Solid child.

### Structure Tree

The `structure` field in every response contains the full scene graph:

```js
{
  root: 4,              // ID of the root product (part or assembly)
  currentProduct: 4,    // currently active product
  currentInstance: 0,   // 0 = no instance (single-part mode)
  testRoot: 0,          // internal
  tree: {               // flat map keyed by string ID
    "4": { id: 4, class: "CC_Part", name: "...", parent: 1, children: [...], members: {...} },
    "54": { id: 54, class: "CC_Box", ... },
    ...
  }
}
```

Use `structure.root` to find the part ID. Use `structure.tree[String(id)]` to inspect any object.

### Batch and IDs

`common.batch` has no dynamic ID forwarding — you cannot reference the result of job 0 in job 1's parameters. Since `part.create` always returns ID 4 on a clean drawing, you can hardcode it. For anything else, use sequential `api.v1.*` calls.

## Coordinate System

ClassCAD uses a **right-handed coordinate system**:
- **X** → right (Right plane normal)
- **Y** → forward (Front plane normal)
- **Z** → up (Top plane normal)

Default work planes: Top (XY, Z-normal), Front (XZ, Y-normal), Right (YZ, X-normal).

## Angles

**All angles are in radians** throughout the API — revolve, twist, chamfer, circular patterns, rotation vectors, `workCSys` rotation, expression trig functions. There is no degree mode.

**`deg` suffix in expressions:** The expression engine supports `Ndeg` to convert degrees to radians: `180deg` → `3.14159...` (PI), `sin(90deg)` → `1`. There is no `rad` suffix (angles are already radians).

**Trig functions:** `sin`, `cos`, `tan`, `asin`, `acos`, `atan` — all in radians. **`atan2` does NOT exist** — use `atan` (single-argument) only.

## Rotation Vectors

Many APIs (`solid.box`, `solid.copy`, `part.workCSys`, etc.) accept a `rotation: [rx, ry, rz]` parameter:
- Each component is a rotation around that axis, in radians
- `[0, 0, PI/4]` → 45° rotation around Z axis
- `[PI/2, 0, 0]` → 90° rotation around X axis

**`rotateFirst` parameter** (default: `TRUE`): When both `rotation` and `translation` are provided, rotation is applied first by default. Set to `FALSE` to translate first.

## Transformation Matrix

`common.transformObjectWithMatrix` accepts a 4x4 matrix. **Must be exactly 4x4** — 3x3 fails: "The provided matrix is not a 4x4 matrix".

**Layout:** Standard math convention — translation in the last column:

```js
matrix: [
  [R00, R01, R02, Tx],  // row 0
  [R10, R11, R12, Ty],  // row 1
  [R20, R21, R22, Tz],  // row 2
  [0,   0,   0,   1 ],  // row 3
]
```

**`isGlobal` parameter** (default: `TRUE`): When `TRUE`, the matrix is in global coordinates. When `FALSE`, it's in the object's local coordinate system.

**Behavior:** Transforms the part's global coordinate system — internal geometry positions remain in local coordinates. The structure tree always shows local coordinates, so work axis directions do not visibly change. Matrices compose — applying the same transform twice doubles the effect.

## Known Doc Discrepancies

- `v1.sketch.isSolved` — listed in API docs but returns code 1201 (unknown command) on the server.

## Related

- `common.batch` — runs multiple API calls, returns nested envelopes
- `common.evaluateExpression` — useful for testing result types (real, point, VOID)
- `common.getAppVersion` / `common.getClassFileVersion` — simplest stateless calls for connection testing
