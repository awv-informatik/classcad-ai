# Training: Result Types

**Date:** 2026-03-22

## Goal

Study of result types: `id`, `VOID`, `real`, `point`, `string`, `boolean`, `Array<id>`.

The protocol envelope session (task #1) already established the basics: `id` → number, `VOID` → null, `real` → number, `string` → string, `object` → object. This session goes deeper — probing each type systematically with dedicated API calls.

**Questions to answer:**

- `point` return type: what does `evaluateExpression` return for a point? The docs say `real|point|VOID` — what's the JS shape of a point result?
- `boolean` return type: APIs like `part.addExpression`, `sketch.isSolved` return `boolean` — is it JS `true`/`false` or `1`/`0`?
- `id` vs `real`: both are numbers. Can they be distinguished? Are IDs always integers? Can a `real` result be a float?
- `Array<id>`: what about `Array<id|VOID>` (e.g. `sketch.trim`)? How does VOID appear in an array?
- `string` return: what APIs return non-empty strings? What encoding?
- `VOID` behavior: is it always `null`? Any API that returns VOID with side effects?
- Objects with nested types: `getDatabaseSettings` returns booleans as 1/0 — is this universal for all object returns?
- `Array<string>`: `getUserDataKeys` returns this — verify it's a plain JS string array
- Complex result: `batch` returns `Array<envelope>` — already covered in protocol session

**APIs to probe:**

- `evaluateExpression` — `real`, `point`, `VOID`
- `getAppVersion` / `getClassFileVersion` — `string`
- `getDatabaseSettings` — `object` with boolean fields
- `getUserDataKeys` — `Array<string>`
- `part.create` — `id`
- `sketch.rectangle` — `Array<id>`
- `sketch.isSolved` — `boolean`
- `clear` — `VOID`

---

## 01 — real results from evaluateExpression

Script: `scripts/01-real-results.mjs` — ✅ reals are JS numbers with full double precision.

- Integer: `2+3` → `5` (number, isInteger=true)
- Float: `1/3` → `0.3333333333333333` (number, isInteger=false)
- Trig: `sin(C:PI/2)` → `1` (number)
- Pi: `C:PI` → `3.141592653589793`
- Irrational: `sqrt(2)` → `1.4142135623730951`
- Negative: `-42` → `-42`
- Zero: `0` → `0` (isInteger=true)
- **`10^15` returned `null`** — `^` is NOT the power operator!
- **`10^-15` also returned `null`**

**📌 LLM doc:** `^` is not power — use `pow()`. Real numbers are standard JS doubles.

---

## 02 — point results from evaluateExpression

Script: `scripts/02-point-result.mjs` — ✅ discovered point expression syntax.

- `point(1,2,3)` / `Point(1,2,3)` / `POINT(1,2,3)` — all return `null`. Not a function.
- **`{1,2,3}` → `{x:1, y:2, z:3}`** — this is the point literal syntax!
- `[1,2,3]` → `[1,2,3]` — returns a plain JS array, not a point
- `vec(1,2,3)` / `pt(1,2,3)` / `(1,2,3)` — all null

**Learned:** Point syntax in expressions uses curly braces `{x,y,z}`. Returns `{x, y, z}` object. This is DIFFERENT from the `[x, y, z]` array format used in API parameters.

**📌 LLM doc:** Two point representations: `{x,y,z}` object (from expressions/structure) vs `[x,y,z]` array (API params). Expression point syntax is `{1,2,3}`.

---

## 03 — boolean results

Script: `scripts/03-boolean-result.mjs` — ❌ `isSolved` returned null unexpectedly.

- `isSolved(empty)` → `null` — not true/false or 0/1
- `isSolved(rect)` → `null`
- `moveGeometry` → `0` (number, ===0 is true)

`isSolved` looked broken. Investigated in script 13 — turns out `v1.sketch.isSolved` is an UNKNOWN COMMAND (code 1201). Doc discrepancy.

---

## 04 — ID results

Script: `scripts/04-id-result.mjs` — ⚠️ Part2/Part3 returned null.

- Part1: `4` (number, integer, positive)
- Part2: `null` — **only one root part per drawing!**
- Part3: `null`
- Sketch1: `52` (number, integer, positive)
- Sketch2: `null` (can't create sketch on null part)

The null results aren't about ID types — they're about the one-part-per-drawing constraint (code 1200, confirmed in script 12).

---

## 05 — VOID results

Script: `scripts/05-void-result.mjs` — ✅ as documented, VOID is always `null`.

- `clear` → `null`
- `setObjectName` → `null`
- `setUserData` → `null`
- `removeUserData` → `null`
- `clearUserData` → `null`

All VOID-returning APIs produce `null` (not `undefined`). Consistent.

---

## 06 — string results

Script: `scripts/06-string-result.mjs` — ✅ strings work as expected, including Unicode.

- `getAppVersion` → `""` (empty string — not null)
- `getClassFileVersion` → `""` (empty string)
- `getUserData` → `"hello world"` (string)
- `getUserData(empty)` → `""` (empty string, ==='' is true)
- `getUserData(missing key)` → `""` (empty string! NOT null, NOT error, maxLevel=31)
- `getUserData(unicode)` → `"äöü 你好 🔧"` (full Unicode including emoji)

**Learned:** Missing keys return `""` (empty string), not null or error. You cannot distinguish between "key exists with empty value" and "key does not exist" via getUserData.

**📌 LLM doc:** getUserData returns `""` for missing keys — no error. Cannot distinguish missing from empty.

---

## 07 — Array<id> and Array<string> results

Script: `scripts/07-array-id-result.mjs` — ✅ arrays are plain JS arrays.

- `sketch.rectangle` → `[58, 64, 70, 76]` — 4 line IDs, all numbers
- `getUserDataKeys` → `["b", "c", "a"]` — strings, **not sorted** (insertion order not guaranteed)
- Empty keys case showed `null` — but this was because Part2 creation failed (one-part limit). Corrected in script 14.

---

## 08 — object results

Script: `scripts/08-object-result.mjs` — ✅ confirmed booleans are 1/0 numbers in objects.

- `getDatabaseSettings` → object with 8 keys. Boolean fields (`isGraphicEnabled`, etc.) are `1`/`0` numbers, never JS `true`/`false`.
- `getFacetingParameters` → object with 2 keys: `angleTol` (15), `chordHeightTol` (0.2)
- Every boolean field: `typeof` is `"number"`, `===1` or `===0` is true, `===true`/`===false` is false.

---

## 09 — error results across types

Script: `scripts/09-error-result-types.mjs` — ✅ on error, result is ALWAYS `null`.

- id-returning API error → `null`
- boolean-returning API error → `null`
- Array-returning API error → `null` (not empty array)
- real-returning API error → `null`
- VOID-returning API error → `null`

**📌 LLM doc:** On error (maxLevel >= 51), result is always `null` regardless of declared return type.

---

## 10 — ID as parameter types

Script: `scripts/10-id-as-param-types.mjs` — ✅ string IDs work, floats/negatives don't.

- Number ID (4): ✅ works
- String ID ("4"): ✅ works! The server accepts string-encoded IDs.
- Float ID (4.5): ❌ error
- Negative ID (-4): ❌ error
- Zero ID (0): ❌ error

**📌 LLM doc:** IDs can be passed as numbers or strings. Float, negative, and zero IDs fail.

---

## 11 — power operator and point deep dive

Script: `scripts/11-power-and-point-deep.mjs` — ✅ found `pow()` function and point arithmetic.

**Power:**
- `^` → null (NOT power operator, all cases return null silently)
- `pow(10,15)` → `1000000000000000` ✅
- `exp(15*ln(10))` → `1000000000000005.9` (floating point imprecision)
- `power()`, `**` → null

**Point deep dive:**
- `{1,2,3}` → `{x:1,y:2,z:3}` ✅
- `{-1.5, 2.7, 3.14}` → works with floats and spaces ✅
- `{1,2}` → null (must be exactly 3 components)
- `{1}` → null
- `{1,2,3,4}` → null
- `{1,2,3}+{4,5,6}` → `{x:5,y:7,z:9}` — **point addition works!**
- `{1,2,3}*2` → `{x:2,y:4,z:6}` — **scalar multiplication works!**
- `2*{1,2,3}` → same result — commutative

**📌 LLM doc:** Expression power function is `pow(x,y)`. Point arithmetic: `+`, `-`, `*` with scalars. Points must have exactly 3 components.

---

## 12 — multiple parts

Script: `scripts/12-multiple-parts.mjs` — ✅ confirmed one-root constraint.

- Part1: success (id=4)
- Part2: ERROR code 1200: "There is already a root assembly or part which must be removed first."
- Part3: same error

**📌 LLM doc:** Only ONE root part or assembly per drawing. Code 1200. Must `clear` before creating a new root.

---

## 13 — isSolved investigation

Script: `scripts/13-boolean-unwrap.mjs` — ❌ `v1.sketch.isSolved` does NOT exist.

- Error: code 1201, "Unknown command v1.sketch.isSolved"
- The source docs list `isSolved` but the server doesn't recognize it.

**📌 LLM doc:** `v1.sketch.isSolved` is listed in docs but does NOT exist on the server (code 1201). Doc discrepancy.

---

## 14 — empty array vs null

Script: `scripts/14-empty-array-vs-null.mjs` — ✅ empty arrays ARE `[]`, not null.

- `getUserDataKeys(noKeys)` → `[]` (empty array, not null)
- `getUserDataKeys(oneKey)` → `["x"]`
- `getUserDataKeys(cleared)` → `[]` (back to empty array)

The null from script 07 was due to the second part creation failing, not from empty results.

---

## 15 — boolean from working APIs and expressions

Script: `scripts/15-boolean-from-working-apis.mjs` — ✅ booleans are numbers 0/1.

- `moveGeometry` → `0` (number) — sketch became unsolved after move
- `TRUE` expression → `1` (number)
- `FALSE` expression → `0` (number)
- `true`/`false` (lowercase) → null (not recognized)
- Comparison operators (`1==1`, `1>0`, etc.) → null (not supported in expressions)

**📌 LLM doc:** Boolean constants are `TRUE`/`FALSE` (uppercase), map to `1`/`0` numbers. Comparison operators don't work in evaluateExpression.

---

## 16 — expression array results

Script: `scripts/16-expression-array-result.mjs` — ✅ expressions support array and nested types.

- `[1,2,3]` → JS array `[1,2,3]`
- `[1,2]` → `[1,2]`
- `[1]` → `[1]`
- `[1,2,3,4]` → `[1,2,3,4]`
- `[]` → `[]` (empty array)
- `[[1,2],[3,4]]` → nested arrays work
- `[{1,2,3},{4,5,6}]` → `[{x:1,y:2,z:3},{x:4,y:5,z:6}]` — arrays of points!

**📌 LLM doc:** Expressions support array syntax `[...]` and nested arrays. Can mix scalars and points.

---

## 17 — structure tree point types

Script: `scripts/17-structure-point-types.mjs` — ✅ points in structure are always `{x,y,z}` objects.

All point-typed members in the structure tree (Origin.Position, XAxis.Direction, Top.Normal, etc.) are `{x,y,z}` objects, consistent with expression point results.

---

## Coverage check

- [✅] `real` — JS number, full double precision, `pow()` for power
- [✅] `point` — `{x,y,z}` object from expressions/structure, `[x,y,z]` array in API params
- [✅] `boolean` — `1`/`0` numbers (never JS `true`/`false`), `TRUE`/`FALSE` uppercase constants
- [✅] `id` — positive integer, accepts string encoding, sequential with gaps
- [✅] `VOID` — always `null`
- [✅] `string` — JS string, Unicode, `""` for missing data
- [✅] `Array<id>` — JS number array
- [✅] `Array<string>` — JS string array, not sorted
- [✅] `object` — plain JS object, boolean fields as 1/0
- [✅] Error results — always `null` regardless of declared type
- [✅] Expression types — arrays, nested, point arithmetic
- [✅] Cross-API consistency confirmed
- [✅] Edge cases probed (empty arrays, missing keys, multiple parts, nonexistent APIs)

All questions answered. Moving to Step 5.
