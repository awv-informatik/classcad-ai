# changes.md — Booleans Deep Training (2026-03-20)

## Skill file changes

### `references/part.md`

**boolean AGENT NOTE** (line ~820): Replaced 2026-03-19 note with comprehensive 2026-03-20 note adding:
- `indices` (0-based) for target and tools with multi-solid features
- 3+ tools in INTERSECTION behavior
- Non-overlapping behavior per type (UNION/SUBTRACTION silent, INTERSECTION errors)
- Empty tools array error code
- Same feature as target+tool succeeds silently
- Boolean features usable as chain targets, pattern targets, brep edge sources

**updateBoolean AGENT NOTE** (line ~858): Consolidated two notes (2026-03-19 + partial 2026-03-20) into single comprehensive note adding:
- Returns feature ID on success (not null)
- Partial updates work
- Object syntax for target/tools in updates
- WARNING: dispatches to open feature type, no boolean-specific validation

## Diff

```diff
- > **AGENT NOTE (trained 2026-03-19):** All three boolean types... Empty tools array fails with error. Non-overlapping subtraction succeeds silently...
+ > **AGENT NOTE (trained 2026-03-20):** All three boolean types... `indices` field (0-based)... Non-overlapping behavior differs by type... Same feature as both target and tool succeeds silently... Boolean features can be chained, patterned, and queried for brep edges...

- > **AGENT NOTE (trained 2026-03-19):** CRITICAL: Requires openFeature... Can change type, name, target, or tools when feature is open.
- > **AGENT NOTE (trained 2026-03-20):** Returns the feature ID on success (not null)...
+ > **AGENT NOTE (trained 2026-03-20):** CRITICAL: Requires openFeature... partial updates work... Returns the boolean feature ID on success (not null)... WARNING: dispatches to whatever feature type is open...
```
