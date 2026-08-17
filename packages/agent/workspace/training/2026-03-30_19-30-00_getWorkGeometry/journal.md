# Training: part.getWorkGeometry

**Date:** 2026-03-30

## Goal

Testing `v1.part.getWorkGeometry` — retrieving work geometry by name.

---

## 01 — built-in work planes

Script: `scripts/01-builtin-planes.mjs` — ✅ Built-in names are exactly `Top`, `Front`, `Right`. Other guesses (`WorkPlane_Top`, `XY`, etc.) all fail.

**Data:** `files/01-builtin-planes-builtin-planes.json` — Top→38, Front→42, Right→46, all others null/maxLevel=51.

**📌 LLM doc:** Built-in plane names: Top, Front, Right (exact match).

## 02 — built-in axes and CSys

Script: `scripts/02-builtin-axes-csys.mjs` — ✅ Built-in axes: `XAxis`, `YAxis`, `ZAxis`. Built-in CSys: `Origin`. Other guesses fail.

**Data:** `files/02-builtin-axes-csys-builtin-axes-csys.json` — XAxis→26, YAxis→30, ZAxis→34, Origin→22.

**📌 LLM doc:** Built-in names: XAxis, YAxis, ZAxis, Origin.

## 03 — user-created work geometry

Script: `scripts/03-user-created.mjs` — ✅ All 4 types found by name. IDs match exactly.

**Data:** `files/03-user-created-user-created.json` — all 4 match: true.

## 04 — case sensitivity

Script: `scripts/04-case-sensitivity.mjs` — Name lookup is **case-sensitive**. "CamelCasePlane" found, "camelcaseplane"/"CAMELCASEPLANE"/"camelCasePlane" all fail. Built-in "Top" found, "top"/"TOP" fail.

**Data:** `files/04-case-sensitivity-case-sensitivity.json`

**📌 LLM doc:** Case-sensitive lookup. Must match exactly.

## 05 — duplicate names

Script: `scripts/05-duplicates.mjs` — With duplicates, returns the **first created** (wp1=54 returned, not wp2=62). Cross-type duplicates same: first created wins (plane=70 returned, not axis=78).

**Data:** `files/05-duplicates-duplicates.json` — sameType: returned=54 (first), crossType: returned=70 (first).

**📌 LLM doc:** Duplicates return the first-created geometry with that name.

## 06 — error cases

Script: `scripts/06-errors.mjs` — All errors return null/maxLevel=51 with descriptive messages.

- Non-existent: `Couldn't find work geometry with name: "DoesNotExist"`
- Empty string: `Couldn't find work geometry with name: ""`
- Missing name param: `"name" must be provided`
- Bogus ID: `invalid id`

**Data:** `files/06-errors-errors.json`

---

## Coverage Checklist

- [x] API called successfully
- [x] Required params tested (id, name)
- [x] Built-in work geometry names discovered (Top, Front, Right, XAxis, YAxis, ZAxis, Origin)
- [x] All 4 work geometry types retrievable
- [x] Case sensitivity confirmed
- [x] Duplicate name behavior tested
- [x] Error cases tested
- [x] Behavioral claims verified with data
