# Training: Api study of `common.setObjectName`

**Date:** 2026-03-31

## Goal

Testing `v1.common.setObjectName` — renames any object by ID. Returns VOID.

**Methods to cover:**

- `setObjectName` — params: `id`, `name`
- Renaming a part
- Renaming a feature (entity injection, work geometry)
- Renaming to empty string
- Renaming to special characters / long names
- Renaming with invalid ID
- Renaming same object twice (overwrite)
- Verifying name was actually set (via structure tree inspection)

**Questions:**

- Does it work on all object types (parts, features, sketches, work geometry)?
- What does it return? VOID per docs — confirm.
- What happens with empty string name?
- What happens with invalid/nonexistent ID?
- Can we verify the name was set (no `getObjectName` exists — check structure tree)?
- Does renaming affect `getWorkGeometry` lookups by name?

---

## 01 — Rename a part (basic happy path)

Script: `scripts/01-rename-part.mjs` — ✅ Works as documented. Returns `null` (VOID), maxLevel=31, empty messages.

**Data:** Structure tree confirms id=4 changed from `OriginalName` to `RenamedPart` (see `files/01-rename-part-structure-before.json` vs `files/01-rename-part-structure-after.json`).

## 02 — Rename an entity injection feature

Script: `scripts/02-rename-feature.mjs` — ✅ Works on features. result=null, maxLevel=31.

**Data:** Structure tree confirms eifId=54 renamed from `EIF_Original` to `EIF_Renamed`.

## 03 — Rename work geometry + getWorkGeometry lookup

Script: `scripts/03-rename-workgeo.mjs` — ✅ Rename works. **Key finding:** `getWorkGeometry` uses the current name, not the original. Lookup by old name returns error (code 1015, level 51: "Couldn't find work geometry with name"). Lookup by new name succeeds.

**Data:** See `files/03-rename-workgeo-lookup-results.json`. Old name → null/error, new name → id 54.

**📌 LLM doc:** After renaming work geometry, `getWorkGeometry` only finds it by the new name. The old name is gone.

## 04 — Rename to empty string

Script: `scripts/04-rename-empty-string.mjs` — ✅ Accepted silently. result=null, maxLevel=31, no error.

**Data:** Structure tree confirms id=4 has name=`""` (empty string). See `files/04-rename-empty-string-structure-after-empty.json`.

**📌 LLM doc:** Empty string is a valid name — no error, no warning. Could break name-based lookups.

## 05 — Special characters and long names

Script: `scripts/05-rename-special-chars.mjs` — ✅ All accepted. Spaces, dashes, underscores, dots, slashes, numeric start, unicode, and 200-char names all work with maxLevel=31.

**Data:** See `files/05-rename-special-chars-special-chars-results.json`.

## 06 — Invalid/nonexistent IDs

Script: `scripts/06-invalid-id.mjs` — Mixed results.

- ID 99999 (nonexistent): maxLevel=51, error code 1006 "invalid id!" + warning "ToId()/TOID() didn't get an existing or valid id."
- ID 0: maxLevel=51, error code 1006 "invalid id!"
- ID -1: **maxLevel=31, no error!** Silent acceptance. Probably treated as a no-op.

**Data:** See `files/06-invalid-id-invalid-id-results.json`.

**📌 LLM doc:** Invalid IDs (99999, 0) return error code 1006. ID -1 is silently accepted (no error) but likely a no-op.

## 07 — Rename same object twice (overwrite)

Script: `scripts/07-rename-twice.mjs` — ✅ Second rename overwrites first. Final name is `Third`.

**Data:** Structure tree confirms id=4 has name=`Third`. See `files/07-rename-twice-structure-after-double-rename.json`.

## 08 — Rename internal/system objects

Script: `scripts/08-rename-internal-objects.mjs` — ✅ Works on internal objects! ExpressionSet, Origin, XAxis, Top all renamed successfully (maxLevel=31).

**Data:** Structure tree confirms all renamed: `Renamed_ExpressionSet`, `Renamed_Origin`, `Renamed_XAxis`, `Renamed_Top`. See `files/08-rename-internal-objects-structure-after-internal-rename.json`.

**📌 LLM doc:** No protection against renaming system objects. Renaming "Origin" or default planes could break workflows that rely on default names.

## 09 — Rename work axis + verify via getWorkGeometry

Script: `scripts/09-rename-workaxis.mjs` — ✅ Consistent with script 03. Rename works, getWorkGeometry finds by new name.

## 10 — Rename default planes (Top)

Script: `scripts/10-rename-default-planes.mjs` — ✅ Default planes can be renamed. After renaming "Top" → "MyTop":
- Lookup "Top" → null, error
- Lookup "MyTop" → id 38, success

**Data:** See `files/10-rename-default-planes-default-plane-rename.json`.

**📌 LLM doc:** Default planes (Top, Right, Front) can be renamed. This breaks `getWorkGeometry` lookups by the default name. Dangerous if downstream code assumes default names.

## 11 — Missing parameters

Script: `scripts/11-missing-params.mjs` — As expected.

- Missing `name`: error code 1004 "parameter 'name' must be provided"
- Missing `id`: error code 1004 "parameter 'id' must be provided"
- Empty params: same as missing id

**Data:** See `files/11-missing-params-missing-params.json`.

## 12 — Duplicate names (sibling deduplication)

Script: `scripts/12-duplicate-names.mjs` — **Surprising finding.** When renaming a sibling to an existing name, the system auto-deduplicates by appending `0`. eif2 renamed to "Feature1" became "Feature10" (not "Feature1").

**Data:** Structure confirms eif1=`Feature1`, eif2=`Feature10`. See `files/12-duplicate-names-structure-dup-names.json`.

**📌 LLM doc:** Sibling name deduplication. The server appends `0`, `1`, etc. to avoid collisions among siblings.

## 13 — Name deduplication pattern

Script: `scripts/13-name-dedup.mjs` — Confirmed pattern. Three EIFs all renamed to "Foo":
- eif1 (original "Foo"): stays `Foo`
- eif2 (renamed to "Foo"): becomes `Foo0`
- eif3 (renamed to "Foo"): becomes `Foo1`

**Data:** See `files/13-name-dedup-dedup-names.json`.

**📌 LLM doc:** Dedup suffix pattern: `<name>0`, `<name>1`, etc. Original keeps its name; subsequent siblings get suffixes.

## 14 — Deduplication scope (sibling vs global)

Script: `scripts/14-dedup-scope.mjs` — Dedup is **sibling-scoped**, not global. An EIF (in OperationSequence) was renamed to "Origin" — same name as the built-in Origin (in ReferenceSet). Both kept the name "Origin" because they are in different parent containers.

**Data:** See `files/14-dedup-scope-dedup-scope.json`. Both id=22 and id=54 have name="Origin".

**📌 LLM doc:** Name uniqueness is enforced per parent container, not globally.

## 15 — Rename to same name (no-op)

Script: `scripts/15-rename-same-name.mjs` — ✅ Works fine, name unchanged. maxLevel=31, no error.
