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
- **Renderer port + multi-view (2026-05-01):** `scripts/render-direct.mjs` now composes assembly instance transforms (was rendering all instances at the template origin) and supports `snapshot('label', { view, zoom, lookAt })` with views `iso`/`top`/`bottom`/`front`/`back`/`left`/`right`. Default is still `iso`. **Pre-2026-05-01 assembly snapshots are invalid for spatial claims** — they showed every instance stacked at the origin. The entire assembly chapter of PLAN.md was unchecked and the assembly LLM docs deleted on this date; that work needs to be redone with the fixed renderer + proper numeric verification per the new SOUL rule.
- **Constraints/dimensions ARE the sketch layout engine (2026-06-10).** SKETCHING.md falsely claimed "constraints are metadata only" and "dimension value param is broken" — root cause: early training used PLANELESS sketches whose solver is silently disabled (constraints accepted with maxLevel 31 but never enforced). On a `planeId` sketch the solver moves geometry immediately and exactly (verified to 15 sig figs: TANGENT+TANGENT+RADIUS laid out the mixer waist fillet at (60, 66.36759374687043) from a rough seed). ph: "constraints and dimensions create viable end results that are conditioned, as opposed to hardcoded values that can't adapt later." Correct workflow: rough/nominal shapes → FIXATION datum (fix line ENDPOINTS, not lines — FIXATION doesn't lock length) → relations → dimensions with `value` → solver lays out → trim. Keep `gen*` flags ON (auto-constraints wire profiles; gen-OFF profiles tear on dimension edits). Fixed in skill @ 9bf4505.
- **When a foundational finding flips, sweep the WHOLE skill** — per-API refs AND guide docs (SKETCHING.md, GRAPHICS.md, STRUCTURE.md). The constraint-metadata error survived in SKETCHING.md long after create.md/constraint.md/dimension.md were corrected. Second stale-propagation incident (first: 2026-04-13 box alignment → six files). Grep for the old claim's keywords before closing any correction session.
- **Reproduce the DRAWING's geometry, not a pre-trimmed profile (2026-07-02, robot-head).** ph: circles a drawing shows complete (boss/eye circles with Ø callouts) must stay FULL/closed in the sketch — connect the profile to them with COINCIDENT-endpoint-on-circle + TANGENT, don't consume them into boundary arcs. And every dimension annotation must exist as a real, visible dimension in the sketch (nose width 3, 3.5-to-center-mark via a constrained sketch point, 8 anchored eye-center→jaw) — encoding a drawing dim only implicitly (via a coincidence) is not enough. Trim to a closed profile only when producing a solid (rim-trim, see SKETCHING.md).
- **Use multiple views when iso is ambiguous, not by reflex.** A through-hole on a plate's broad face is invisible in iso (edge-on); take a `'top'` snapshot to confirm. A constraint that repositions an instance along a hidden axis can be verified with a different view. Default to iso first; add views only when there's a specific spatial fact iso can't show.

## Skill copy

- `knowledge/classcad-skill/` — canonical submodule. **Edit here.** This is what cc trains and where commits should land. Consumers (classcad-mcp, @buerli.io/ai) get it as the published `@classcad/skill` npm package — publish after committing so they can upgrade.

## Infrastructure

- **`@classcad/api-js` is the typed wrapper the harness uses** (`scripts/run.mjs` imports `v1` from it). It is NOT on npm — it's a tarball pinned in the **outer** repo `package.json` (`https://awvstatic.com/classcad/download/release/<ver>/classcad-api-js-<ver>.tgz`). Each method is a thin facade call, and the package is codegen'd ("DO NOT MODIFY BY HAND"). **If a server method exists but `api.v1.<ns>.<m>` throws "is not a function", the wrapper is stale — bump the tarball version in package.json + `npm install`.** 2026-06-30: bumped 21.0.0→21.2.0 to get `splitCurve`/`preTrim`/`trim`/`postTrim`. `common.batch({jobs:[{api:'v1.x.y',param}]})` is a generic fallback to invoke any server API the wrapper lacks. The `postinstall` `sync-submodule.mjs` skips updating the skill submodule when it has local changes.
- **Harness pacing:** each `node scripts/run.mjs` run has ~20s fixed overhead (connect + render + teardown). Running >3–4 scripts in one Bash call hits the 2-min tool wall — batch ≤3–4, or run individually. Snapshots (sharp render) add the most time; for numeric-proof tasks drop `snapshot()` entirely. `part.create` works **once per run** (2nd call returns VOID — TODO #18); build extra geometry as more sketches/lines on the one part.
