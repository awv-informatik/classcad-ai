# Changes — Result Types Session

## Modified: `references/common/generic.md`

> Note: This session's changes and the prior session's new file were committed together in `d64ff30`
> because the prior session did not commit. The diff below is reconstructed manually — showing
> what this session added/changed vs what the protocol-envelope session originally wrote.

### Result Types table — replaced

```diff
-| Doc type      | JS type    | Example                        | Notes                                        |
-|---------------|------------|--------------------------------|----------------------------------------------|
-| `id`          | `number`   | `4`, `52`                      | IDs are plain integers                       |
-| `Array<id>`   | `number[]` | `[58, 64, 70, 76]`            | Array of integer IDs                         |
-| `real`        | `number`   | `5`, `1`, `42`                 | Standard JS number                           |
-| `string`      | `string`   | `""`, `"1.0"`                  | Standard JS string                           |
-| `VOID`        | `null`     | `null`                         | NOT undefined — always `null`                |
-| `object`      | `object`   | `{ angleTol: 15, ... }`       | Plain JS object; booleans come as `1`/`0`    |
-| `point`       | `object`   | `{ x: 0, y: 0, z: 0 }`       | Object with x/y/z keys (in structure data)   |
-
-**Key gotcha:** Boolean values in returned objects (e.g. from `getDatabaseSettings`) are numbers `1`/`0`, not JS `true`/`false`.
+| Doc type       | JS type    | Example                        | Notes                                        |
+|----------------|------------|--------------------------------|----------------------------------------------|
+| `id`           | `number`   | `4`, `52`                      | Positive integers, sequential with gaps      |
+| `Array<id>`    | `number[]` | `[58, 64, 70, 76]`            | Array of integer IDs                         |
+| `real`         | `number`   | `5`, `0.333`, `3.14159`        | Full JS double precision                     |
+| `boolean`      | `number`   | `1`, `0`                       | NOT JS `true`/`false` — always `1` or `0`    |
+| `string`       | `string`   | `""`, `"hello"`                | Full Unicode support including emoji          |
+| `VOID`         | `null`     | `null`                         | NOT undefined — always `null`                |
+| `object`       | `object`   | `{ angleTol: 15, ... }`       | Plain JS object; boolean fields are `1`/`0`  |
+| `point`        | `object`   | `{ x: 0, y: 0, z: 0 }`       | Object with x/y/z keys                       |
+| `Array<string>`| `string[]` | `["a", "b"]`                   | Plain JS string array, unordered             |
```

### New subsection: Type details (added after table)

```diff
+### Type details
+
+**`boolean`:** Universally `1`/`0` numbers — in API results, object fields, and expressions. Never JS `true`/`false`. Expression constants are `TRUE`/`FALSE` (uppercase only; lowercase `true`/`false` are not recognized).
+
+**`id`:** Positive integers. IDs are sequential but with gaps (a part creates ~50 child objects, so the next part ID is ~50 higher). As parameters, IDs accept both numbers and string-encoded numbers (`4` and `"4"` both work). Float, negative, and zero values fail.
+
+**`point`:** Two representations exist — **do not confuse them:**
+- **API parameters** use `[x, y, z]` arrays (e.g. `startPos: [0, 0, 0]`)
+- **API results, structure tree, and expressions** use `{x, y, z}` objects
+
+**`string`:** Full Unicode including emoji. `getUserData` returns `""` for missing keys (no error) — you cannot distinguish "key exists with empty value" from "key does not exist".
+
+**`VOID`:** All VOID-returning APIs (`clear`, `setObjectName`, `setUserData`, etc.) return `null`.
+
+**Empty arrays:** APIs returning `Array<*>` give `[]` for empty results, not `null`. But on error, result is `null` (not empty array).
+
+**On error:** Result is **always `null`** regardless of declared return type — whether the API normally returns `id`, `boolean`, `Array`, `real`, or `VOID`.
```

### Error codes table — added code 1200, updated 1201

```diff
 | 1007 | Wrong ID type                    | Part ID where feature/operation ID expected  |
+| 1200 | Root already exists              | Second `part.create` in same drawing         |
-| 1201 | Unknown command                  | `v1.common.doesNotExist`                     |
+| 1201 | Unknown command                  | `v1.common.doesNotExist`, `sketch.isSolved`  |
```

### New sections added at end (before Related)

```diff
+## Expression Engine
+
+`evaluateExpression` supports a rich expression language:
+
+**Arithmetic:** `+`, `-`, `*`, `/` work on reals. Use `pow(x, y)` for exponentiation — `^` is **NOT** a power operator (silently returns null).
+
+**Functions:** `sin`, `cos`, `sqrt`, `pow`, `exp`, `ln`, etc. Constants use `C:` prefix: `C:PI`.
+
+**Points:** Literal syntax `{x, y, z}` (curly braces, exactly 3 components). Returns `{x, y, z}` object.
+- Point arithmetic: `{1,2,3}+{4,5,6}` → `{x:5,y:7,z:9}`
+- Scalar multiplication: `{1,2,3}*2` → `{x:2,y:4,z:6}` (commutative)
+- `{1,2}` or `{1,2,3,4}` → null (must be exactly 3 components)
+
+**Arrays:** `[1,2,3]` syntax, supports nesting `[[1,2],[3,4]]` and mixed types `[{1,2,3},{4,5,6}]`.
+
+**Booleans:** `TRUE` → `1`, `FALSE` → `0` (uppercase only). Comparison operators (`==`, `>`, `<`) do NOT work.
+
+## Drawing Constraints
+
+- **One root per drawing:** Only one `part.create` or `assembly.create` per drawing. Second call fails with code 1200. Must `clear` first to start over.
+
+## Known Doc Discrepancies
+
+- `v1.sketch.isSolved` — listed in API docs but returns code 1201 (unknown command) on the server.
```

### Related section — minor update

```diff
-- `common.evaluateExpression` — useful for testing result types (real, VOID)
++ `common.evaluateExpression` — useful for testing result types (real, point, VOID)
```
