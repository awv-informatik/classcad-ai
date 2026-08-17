# Changes — assembly.cylindrical training session

**Commit:** `ba821c1` — `train: cylindrical constraint — create/update/get with asymmetric partial limits`

## Files changed

- `references/assembly/cylindrical.md` — **NEW** (120 lines) — LLM doc for cylindrical constraint creation
- `references/assembly/updateCylindrical.md` — **NEW** (110 lines) — LLM doc for updating cylindrical constraints
- `references/assembly/getCylindrical.md` — **NEW** (136 lines) — LLM doc for retrieving cylindrical constraints
- `references/assembly/revolute.md` — **UPDATED** (+1 line) — Added cross-type name collision gotcha
- `references/assembly/getRevolute.md` — **UPDATED** (1 line changed) — Updated type-specific lookup to cross-type name collision

## Key diff excerpts

### New: cylindrical.md — Asymmetric partial limits (key finding)

```diff
+## Asymmetric Partial Limits on Create
+
+| Limit type | Partial allowed on create? | Partial allowed on update? |
+|---|---|---|
+| `zOffsetLimits` | **YES** — min-only or max-only | YES |
+| `zRotationLimits` | **NO** — both min and max required | YES |
+
+This is a key difference: `zOffsetLimits` accepts partial specs on create while `zRotationLimits` does not. Both accept partial specs on update.
```

### Updated: revolute.md — Cross-type name collision (new finding)

```diff
 - **getRevolute returns first match.** If multiple constraints share a name, only the first is returned.
+- **Cross-type name collision.** All get* methods find the FIRST constraint by name regardless of type. If a cylindrical was created before a revolute with the same name, `getRevolute` will fail. Use unique names across constraint types.
```

### Updated: getRevolute.md — Corrected type-specific lookup description

```diff
-- **Type-specific lookup** — getRevolute only finds revolute constraints. A fastenedOrigin with the same name is invisible to getRevolute.
+- **Cross-type name collision** — all get* methods find the FIRST constraint by name regardless of type. If a cylindrical was created before a revolute with the same name, `getRevolute` will fail because the cylindrical is found first. Use unique names across constraint types.
```
