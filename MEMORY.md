# MEMORY.md — Long-Term Memory

Core rules and training discipline are in `SOUL.md`. This file tracks **learned state** — what's been discovered, what ph has corrected, and what to remember across sessions.

## Skill Awareness

- Primary skill: `knowledge/classcad-skill/` (git submodule)
- Skill definition: `knowledge/classcad-skill/SKILL.md`
- 7 API domains in `knowledge/classcad-skill/references/`:
  - `assembly.md` — `v1.assembly.*`
  - `common.md` — `v1.common.*`
  - `curve.md` — `v1.curve.*`
  - `drawing2d.md` — `v1.drawing2d.*`
  - `part.md` — `v1.part.*`
  - `sketch.md` — `v1.sketch.*`
  - `solid.md` — `v1.solid.*`

## Training Progress

- 2026-03-20 — **Solid / fillet refresher (partial, paused)**
  - Session: `workspace/training/2026-03-20_17-13-00_solid-fillets-again/`
  - Reconfirmed: baseline fillet behavior, decimal radius support, oversize-radius silent no-op, empty `geomIds` returns `[]`, strict EIF id type requirement.

- 2026-03-20 — **Part / linearPattern (completed)**
  - Session: `workspace/training/2026-03-20_17-26-30_part-linearpattern/`
  - Covered create + update flows, target forms (`id`, `{id}`, `{id, indices}`), `dir1/dir2`, inverted, merged, multi-target, and error cases.
  - Key findings added to skill: `merged=true` fuses overlaps (union-like), `updateLinearPattern` can add `dir2` post-creation, success returns feature id while failures return null.

- 2026-03-20 — **Curve / polyline2d (completed)**
  - Session: `workspace/training/2026-03-20_17-53-07_curve-polyline2d/`
  - Ran 20 scripts across happy paths, strict length/type validation, close semantics, batch calls, id-type validation, and bulge sign behavior.
  - Key findings added to skill: strict `bulges.length === points.length` enforcement (short/long/points-1 all fail), shape-id-only requirement for `id`, `closed` is silently ignored (must use `close`), batch input works, and trailing bulge on open polyline appears geometrically inactive.

## Feedback from ph

- Expect 15-25 scripts per topic, not 4. Cover the full API surface.
- The journal should read like a lab notebook with real findings, not generic summaries.
- The harness is a thin runner — cc writes the journal, not the harness.
- **Don't get stuck in the scripting loop** — finish journal + skill updates + changes.md promptly, not after being asked.
- Mind the viewer/camera when placing cuts/fillets/etc. If modifications are on the hidden/back side, before/after snapshots become ambiguous. Use renderer projection direction intentionally.
