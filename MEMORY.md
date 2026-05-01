# MEMORY.md — Long-Term Memory

Core rules and training discipline are in `SOUL.md`. This file tracks **learned state** — what's been discovered, what ph has corrected, and what to remember across sessions.

## Skill Awareness

- Primary skill: `knowledge/classcad-skill/` (git submodule)
- Skill definition: `knowledge/classcad-skill/SKILL.md`
- 7 API domain references (read-only): `knowledge/classcad-skill/references/api/<domain>.md`
- LLM docs (your deliverables): `knowledge/classcad-skill/references/<domain>/<apiName>.md`
- Training plan with checkboxes: `workspace/PLAN.md`
- Training pipeline: `workspace/HOW-TO-TRAIN.md`

## Feedback from ph

- Expect 15-25 scripts per topic, not 4. Cover the full API surface.
- The journal should read like a lab notebook with real findings, not generic summaries.
- The harness is a thin runner — cc writes the journal, not the harness.
- **Don't get stuck in the scripting loop** — finish journal + LLM docs + changes.md promptly, not after being asked.
- Mind the viewer/camera when placing cuts/fillets/etc. If modifications are on the hidden/back side, before/after snapshots become ambiguous. Use renderer projection direction intentionally.
- **Use data, not just snapshots.** `filewrite` API responses (especially `graphic` and `structure`) to verify behavior numerically. The renderer auto-scales — visual comparison alone is unreliable for size/dimension changes. Compare vertex counts, bounding boxes, return values. Console output is auto-captured to `.log` files, but structured data should be explicitly `filewrite`'d in scripts.
- The `updateExpression` recalc finding (2026-03-24 session) was **wrong** — geometry DID update immediately, but auto-zoom made before/after PNGs look identical. This is the cautionary tale for why data verification matters.
- The 2026-04-13 `solid.box` and `solid.cylinder` training sessions invented spatial claims ("corner-aligned at origin", "z=0 to z=height") from generic-CAD muscle memory without writing a script that measured a vertex coordinate. Both claims were wrong (verified 2026-05-01: solid.* primitives are fully centered at origin) and propagated to six skill docs via cross-references. **Spatial claims now require numeric proof per SOUL.md.** A regression test lives at `scripts/verify-primitive-alignment.mjs`.
- **`solid.*` and `part.*` use DIFFERENT alignment conventions** (verified 2026-05-01): `solid.box/cylinder/cone/sphere` are all fully centered at origin; `part.box` is corner-aligned (+X+Y+Z); `part.cylinder` and `part.cone` are base-anchored (z=0..H); `part.sphere` is centered (the only `part.*` that matches its solid sibling). Full table in `references/part/feature-vs-direct.md#alignment-conventions-differ`.

## Two skill copies — don't confuse them

- `knowledge/classcad-skill/` — canonical submodule. **Edit here.** This is what cc trains and where commits should land.
- `knowledge/classcad-mcp/classcad-skill/` — second submodule of the same repo, embedded inside the classcad-mcp server so `describe_method` can append the LLM doc tail at runtime. **Don't edit here directly** — sync from canonical after committing there. Both share the `awv-informatik/classcad-skill` GitHub remote.
