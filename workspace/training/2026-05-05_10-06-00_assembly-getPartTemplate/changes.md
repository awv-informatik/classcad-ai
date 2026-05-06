# Changes: assembly.getPartTemplate training

## New file: `references/assembly/getPartTemplate.md`

```diff
+# assembly.getPartTemplate
+
+Retrieves part templates from the PartContainer — either all of them or one by exact name.
+
+## Prerequisites
+
+- None. Works even without `assembly.create` (returns empty array).
+
+## Key Parameters
+
+- `name` — (optional) Exact name of the template to find. Case-sensitive. If omitted, returns all part templates.
+
+## Return Value
+
+**Two distinct return shapes:**
+
+| Call | Result | maxLevel |
+|---|---|---|
+| `getPartTemplate()` or `getPartTemplate({})` | `Array<id>` — all template IDs, creation order | 31 |
+| `getPartTemplate({ name: 'X' })` — found | `id` (single number) | 31 |
+| `getPartTemplate({ name: 'X' })` — not found | `null` | 51 |
+
+The listing mode **always** returns an array, even with 0 or 1 templates. The name mode **always** returns a single number or null — never an array.
+
+## Gotchas
+
+- **Case-sensitive, exact match only.** `'Alpha'` works; `'alpha'`, `'ALPHA'`, `'Alp'` all fail with null/maxLevel=51.
+- **Empty-string name works.** `getPartTemplate({ name: '' })` finds a template created with `partTemplate({ name: '' })`.
+- **Scoped to PartContainer only.** Assembly templates invisible. No cross-contamination.
+- **Deduplicated names individually addressable.** "Bolt", "Bolt0", "Bolt1" each findable.
+- **Live query after deletion.** Deleted templates vanish immediately.
+- **Ordering is creation order** (ascending ID), not alphabetical. Stable.
+- **Templates persist after instancing.**
+- **No assembly required for listing.** Returns `[]` gracefully.
+
+## Working Example
+
+```js
+const all = (await api.v1.assembly.getPartTemplate()).result         // Array<id>
+const id = (await api.v1.assembly.getPartTemplate({ name: 'X' })).result  // number | null
+```
```
