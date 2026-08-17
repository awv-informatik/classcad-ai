# Changes — assembly.getRevolute

## File: `references/assembly/revolute.md`

Expanded the `## getRevolute` section from a 6-line stub to full documentation with parameters, return value details, failure cases, batch behavior, update semantics, and duplicate name handling.

```diff
 ## getRevolute
 
-`getRevolute({ id: asmId, name: 'Rev1' })` — returns full constraint state:
+`getRevolute({ id: asmId, name: 'Rev1' })` — queries a revolute constraint by name.
+
+### Parameters
+
+- `id` — **assembly root ID only**. Despite docs saying "product or instance", instance IDs and template IDs return null/error. Always pass the assembly root.
+- `name` — constraint name string (case-sensitive)
+
+### Return Value
+
+Success (`maxLevel: 31`):
 ```js
 {
   id, name,
   mate1: { path, csys, flip, reorient },
   mate2: { path, csys, flip, reorient },
   zOffset,
-  zRotationLimits: { min, max }  // radians or null
+  zRotationLimits: { min, max }
 }
 ```
-Non-existent name → `result: null, maxLevel: 51`.
+
+- `zRotationLimits` — always an object, never null. No limits → `{ min: null, max: null }`. With limits → radians (degree strings converted on storage).
+- `flip` — string: `'Z'`, `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`
+- `reorient` — string: `'0'`, `'90'`, `'180'`, `'270'`
+
+### Failure Cases
+
+All return `result: null, maxLevel: 51`:
+- Non-existent name
+- Empty name `''`
+- Wrong constraint type (e.g., querying a fastenedOrigin name) — type-specific lookup
+- Instance or template ID passed as `id`
+
+### Batch
+
+Pass an array of `{ id, name }` objects. Returns `Array<result|null>`. `maxLevel` is the worst across all items — one null contaminates the envelope to 51.
+
+### After Updates
+
+getRevolute is a live view. After `updateRevolute`:
+- Changed fields are immediately reflected
+- Renamed constraints are only findable under the new name — old name returns null
+
+### Duplicate Names
+
+If multiple revolute constraints share a name (silently allowed), getRevolute returns the first-created one. No error or warning.
```
