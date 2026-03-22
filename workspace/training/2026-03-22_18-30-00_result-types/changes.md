# Changes — Result Types Session

## Modified files

### `references/common/generic.md` (UPDATED — untracked file from prior session)

Updated the existing protocol envelope LLM doc with comprehensive result type findings:

**Result Types table:**
- Added `boolean` type (was missing) — `1`/`0` numbers, never JS `true`/`false`
- Added `Array<string>` type
- Enhanced notes for `id` (sequential with gaps, accepts string encoding)
- Enhanced notes for `point` (two representations: `{x,y,z}` object vs `[x,y,z]` array)
- Enhanced notes for `string` (Unicode support, missing key behavior)
- Added "empty arrays" and "on error" notes

**New "Type details" subsection:**
- Detailed boolean behavior (uppercase `TRUE`/`FALSE` constants)
- ID format (string encoding works, float/negative/zero fail)
- Point dual representation warning
- String missing-key gotcha (returns `""`, not null)
- VOID consistency
- Empty array vs null distinction
- Universal null on error

**New "Expression Engine" section:**
- `pow()` for power (not `^`)
- Point literal syntax `{x,y,z}` with arithmetic
- Array syntax `[...]` with nesting
- Boolean constants and missing comparison operators

**New "Drawing Constraints" section:**
- One root part/assembly per drawing (code 1200)

**New "Known Doc Discrepancies" section:**
- `v1.sketch.isSolved` doesn't exist (code 1201)

**Error codes table:**
- Added code 1200 (root already exists)
- Updated 1201 example to include `sketch.isSolved`

```
$ cd knowledge/classcad-skill && git status references/common/
Untracked files:
  references/common/

$ wc -l references/common/generic.md
161 references/common/generic.md
```
