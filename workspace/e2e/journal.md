# E2E benchmark journal — one prompt, three hosts

The same host-neutral prompts are run verbatim in every agent host: the **root
agent** (harness, node worker — the ground truth), **buerli-ai** (buerligons
in-app panel, WASM engine, Fable via Copilot), and the **classcad MCP**
(stdio, node worker). Prompts + examiner criteria: [sprocket-prompt.md](sprocket-prompt.md)
(benchmark #1), [sprocket-triple-prompt.md](sprocket-triple-prompt.md)
(benchmark #2). Model for all runs: Claude Fable 5.

Source rule for filesystem-capable hosts: skill docs, recipes and the data
contract are fair game; `workspace/training/` and `workspace/output/` are off
limits (prior solutions).

---

## Warm-up: block + bore + top-edge chamfer (root agent)

Context-free agent, discovers everything from the repo MDs. First run, all
green: DATA.md found via the TOOLS.md pointer, 4 outer top edges selected by
straightness predicate (bore rim correctly excluded), volume −0.0004% vs
analytic, chamfer only on the outer rectangle.

![gt0](files/gt0-agent-block-bore-chamfer-sheet.png)

Side find: bore rim arrived as ONE closed polyline (docs said 2 seam-split
arcs) — doc-clarification candidate.

---

## Benchmark #1 — ANSI 35 sprocket, 15T, constrained sketch (`sprocket-prompt.md`)

The core is a CONSTRAINED tooth-space sketch (seat center coincident on the
pitch circle, TANGENT flanks, @expr-bound dimensions), merged pattern, ONE
subtraction, live-parametric bore test.

| Criterion | root agent (GT) | buerli-ai | mcp |
| --- | --- | --- | --- |
| Expressions in model (formulas) | ✅ 14 | ✅ 12+ | ✅ 14 (readback = JS math to 1e-15) |
| Constrained sketch (from tree) | ✅ RootOnPitch, TanL/R, lgsState 1 | ✅ CenterOnPitch/CL, TanL/R, Sym | ✅ SeatOnPC/CL, TangentL/R, CapSym — none unsolved |
| Dims @expr-bound | ✅ every one; ANGLE correctly avoided | ✅ (`PitchR`,`SeatR`,`CapH`,`CapW`,`BlankOD`,`BoreDia`) | ✅ (`Rp`,`Rs`,`capW`,`capY`); flank angle encoded as expr-bound capW — zero unbindables |
| Merged pattern + ONE subtraction | ✅ | ✅ | ✅ (`count:'@expr.N'`, merged:1) |
| Tooth count from geometry | ✅ 15/15 | ✅ 15/15 (owner join) | ✅ 15/15 (azimuth clustering, data-driven gap) |
| Volume in bounds | ✅ 13292.8 mm³ | ✅ 13476.8 mm³ | ✅ 13132.99 mm³ |
| Live bore B 16→20 | ✅ relErr 0.044% | ✅ relErr 0.065%; restored B=16, volume bit-exact | ✅ relErr 0.013%; restored B=16 exact |
| Sheet snapshot | ✅ | ✅ (rendered in-app; edges missing → fixed, see history) | ✅ ([files/mcp-bench1/](files/mcp-bench1/)) |
| Run shape | 1 pass, 37 calls, ~12 min | 1 pass, ~8 rounds, zero manual continues (after fixes) | 2 passes (engine crash between): 40 min blocked by preTrim hang + 4 min rebuild after worker restart; 24 run_scripts, solver seeded off-value on purpose |

MCP run notes: headless `claude -p` runner, MCP tools whitelisted only —
repo/filesystem access DENIED by permissions (source rule held; verified in the
transcript: the Glob/ls attempts errored, the only successful shell calls were
`ps`/`sleep` diagnostics while it monitored the dying worker). Agent found TWO
doc/engine defects (history #22, #23) and reported both instead of silently
working around them.

![gt1](files/gt1-agent-ansi35-15T-sheet.png)

Solver proof (GT): seeds deliberately perturbed; solved junctions matched the
analytic layout at 3.9e-8 mm. buerli-ai extra: the ToothSpace sketch is open
in the editor with live `@expr` dimensions visible in the viewport.

### Earlier buerli-ai attempts (pre-fix) — what broke

1. Attempt 1 (2026-08-17 morning): one big sketch script hit the 60s timeout;
   WASM threw `std::bad_alloc` in the RESPONSE path (5×: circle/line/
   arcByCenter) while mutations landed; agent degraded to micro-scripts,
   turns died every 6–8 tools, three manual "continue"s, run abandoned at
   `checkpoint · cutter-sketch-done`. Agent behavior itself was correct
   (checkpoints, restore, fire-then-verify adaptation).
2. Attempt 2 (after truncation fix): first bulk docs call truncated at the
   generic 30KB tool-result cap → agent fell back to per-doc batches; turn
   died after "Now building." — abandoned to fix the real causes.
3. Attempt 3: PASS (table above).

---

## Benchmark #2 — T35A40SS triple-strand, 40T (`sprocket-triple-prompt.md`)

3 plates (t 0.162) spaced K 0.399, staircase blank Ø4.9898/Ø3.75, tip tapers
slope 1/4 on all six faces, Ø1.5 bore + 3/8×3/16 keyway + 0.03×45° rim
chamfers. Inches.

| Criterion | root agent (GT2) | buerli-ai | mcp |
| --- | --- | --- | --- |
| 3 strands from geometry | ✅ centers −0.399/0/+0.399 (spacing err 0.0), extents 0.162 (2.8e-17), tip lands 0.06825 | ✅ centers −0.399/0.000/+0.399, extents 0.162 ×3 | ✅ centers −0.399/0.000/+0.399 (spacing exactly K), extents 0.162 ×3 |
| 40 teeth per strand | ✅ 40/40/40 (mesh AND edge points) | ⚠️ 40 (middle plate only measured) | ✅ 40/40/40 (azimuth clusters) |
| Root radius = Rr | ✅ worst err 4.4e-16 | ✅ worst err 8.9e-16 (brep arc-midpoints, 24 probes) — first probe CAUGHT the literal on-pitch-circle seat (floor Rp−Rs), agent re-centered to Rr+Rs by measurement | ✅ worst err 2.2e-15 (brep-exact, 160 probes; tessellation cross-check 9.1e-8) |
| Bore 0.750 / keyway floor 0.9375 | ✅ 5.5e-9 / exact | ✅ exact / exact (width 0.375 exact) | ✅ ±3e-6 / exact |
| Volume | ✅ 12.0130 in³, own analytic 0.007% | ⚠️ 12.820 in³ — +6.7% vs GT2, OUT of the ±1.5% band (see note) | ✅ 12.0097 in³ (0.027% vs GT2; own analytic 0.0043%) |
| Sheet | ✅ | ✅ ([sheet](files/bench2-buerli-ai-sheet.png) + [axis section](files/bench2-buerli-ai-section.png) — smooth arcs, adaptive faceting live in-browser) | ✅ ([files/mcp-bench2/](files/mcp-bench2/)) |
| Run shape | 1 pass, 36 calls, ~20 min, solid.* EIF path per recipe, 4 booleans total | 1 pass, ~35 min, ZERO manual continues, ZERO stream breaks (all rounds done=true/cleanTail=true); 1 bulk docs (19 keys) + 1 big build script + chamfers + verify loop | 1 pass, 31 turns, 15 min, 12 run_scripts, revolve-based blank, ONE multi-tool subtraction |

**buerli-ai bench-#2 volume note:** the prompt does NOT pin the flank angle
("straight tangent flanks opening past ODb") — GT2 and mcp chose the ANSI
construction (~33.5° splay), this run chose 17° → narrower tooth gaps → more
material. Partly legitimate design freedom, partly suspect tip tapers (the run
books tapers+keyway+chamfers at ~0.03 in³ where GT2's tapers alone remove
~0.4). FIX FOR THE BENCHMARK FILE: pin the flank half-angle (ANSI
(35−60/N)°) or define the volume band per construction choice. The run PASSED
every geometric criterion; the volume criterion needs this prompt refinement
to be comparable across runs.

MCP bench-#2 notes: same spec intelligence as GT2 (seat centered at Rr+Rs so
the bottom lands on Rr — the "on the pitch circle" literalism cannot meet the
1e-13 check; both agents derived this independently). One honest blemish: a
coarse-tessellation probe (default faceting chordHeightTol 0.1 emits no
interior vertices on small faces) made the agent think the seat was uncut; it
added a redundant patterned seat-disk subtraction, then PROVED it a geometric
no-op (ΔV 5e-5 in³ ≈ noise) instead of hiding it. Faceting-probe caveat =
doc candidate for the verification recipe. Contamination check: single
non-MCP call (a Write to its own session memory), no repo access.

![gt2](files/gt2-agent-t35a40ss-sheet.png)

GT2 findings:
- **The 2026-08-10 reference volume (13.77875 in³) was measured WITHOUT the
  bore/keyway subtraction** — GT2 matches it to 0.04% at exactly the pre-bore
  stage; the bore+keyway delta equals the analytic bore+keyway volume; the old
  MC estimate shared the omission (which is why the old session
  self-validated). Corrected reference: **12.0130 in³**.
- Spec intelligence: a seating arc literally centered ON the pitch circle
  would bottom at Rp−Rs ≠ Rr (Rs > Dr/2); the agent chose the ANSI
  construction (center at Rr+Rs) and said so.
- Engine nuances found: short seating arcs tessellate endpoint-only (3-point
  circumfit impossible from graphic; 2-point+Rs reconstruction works); OD mesh
  vertices sit up to ~1e-5 off the exact cylinder (tolerance when filtering).
- Run 1 of GT2 was INVALIDATED (spawn prompt allowed reading prior training
  sessions; the agent — correctly following its instructions — opened the
  original `_model.mjs`). Stopped, re-run with the strict source rule.

---

## Benchmark #3 — D35C13SS double-strand with style-C hub ([sprocket-double-prompt.md](sprocket-double-prompt.md))

2 plates (t 0.162, K 0.399), HUB COLLARS Ø1.109375 × 0.4 on both sides +
same-Ø spacer (LTB 1.361), bore 0.625 + 3/16×3/32 keyway, Ø0.25 radial set
screw at 90° to the keyway on the back collar, 4 tip-taper faces. Flank angle
PINNED at (35−60/N)° — the bench-#2 lesson. Inches.

| Criterion | root agent (GT3) | buerli-ai | mcp |
| --- | --- | --- | --- |
| 2 strands from geometry | — pending | ✅ centers ±0.1995 exact, extents 0.162 exact (probe self-corrected: first pass caught taper bands) | — pending |
| 13 teeth per strand | — | ✅ 13/13 | — |
| Root radius = Rr | — | ✅ worst 5.6e-7 (mesh circle-fit; Rs err 2.7e-7) | — |
| Hub/collar + spacer + LTB | — | ✅ 0.5546875 on all three faces (9.8e-10 brep), spans exact, LTB 1.3610 | — |
| Bore / keyway | — | ✅ 0.3125 exact / floor 0.40625 exact | — |
| Set screw | — | ✅ cylinder-fit R 0.1249987, center (y,z)=(0, 0.4805002), pierces hub OD → bore; visible in section | — |
| Volume | — | ✅ 1.12069 in³ — inside examiner band [1.00, 1.37] and its own bracket | — |
| Sheets | — | ✅ [sheet](files/bench3-buerli-ai-sheet.png) + [section](files/bench3-buerli-ai-section.png) | — |
| Run shape | — | 1 pass, ~25 min: 1 bulk docs (19 keys) → ONE staged build script (blank+cutter+pattern+tapers+bore+keyway+screw, ONE subtraction) → chamfers+verify → probe refinements. First run on the fully monorepo-sourced stack (no submodule) | — |

![bench3 sheet](files/bench3-buerli-ai-sheet.png)

![bench3 section](files/bench3-buerli-ai-section.png)

Bench-#3 buerli-ai notes:
- **Interactive steering worked**: ph interjected mid-run ("the facetting is
  rough, can this be fixed?") — the agent handled it as a side quest
  (setFacetingParameters 0.0005 + recalc, verified chord dev 2.5e-6 from the
  MESH, correctly noted b-rep numbers were never affected) and resumed
  verification on ph's "you can continue".
- **Viewport faceting gap**: the SNAPSHOT path auto-applies adaptive faceting,
  but the buerligons 3D VIEWPORT renders the store tessellation at the engine
  default (0.1 in model units — chunky for inch models). Improvement
  candidate: adaptive default in the app / after part creation.
- Live thinking ticker ran throughout (first bench with it).

## Defects & improvements history (2026-08-17)

Chronological; each entry = defect observed → change shipped (classcad-ai
commits; buerli-ai mirror + websites submodule synced each time).

| # | Defect / observation | Fix / change |
| --- | --- | --- |
| 1 | In-app turns died every 6–8 tools ("narrate then silence") | Chat providers map `finish_reason: 'length'` → `max_tokens`; loop auto-continues truncated rounds (8 budget, separate from nudges); capabilities take min(max_output, non-streaming 16k cap) |
| 2 | Copilot drops tool-call payloads (`finish=tool_calls`, `tool_calls=0` — 6× in one passing run) | Lost-call retry: stop_reason tool_use with zero tool_use blocks → deterministic re-issue request |
| 3 | 60s script timeout forced micro-scripts on slow WASM | Browser default 180s (cap 300s); prompt/tool text: few SUBSTANTIAL staged scripts |
| 4 | Discovery = one agent round per doc; whole context re-sent each round | `docs(keys[])` bulk tool replaces describe_method/read_doc; PLAN FIRST, fetch once |
| 5 | Bulk docs result silently cut at generic 30KB cap | 160KB cap for docs results, 40KB per-doc guard |
| 6 | `std::bad_alloc` in WASM response path (graphic serialization per response) | Per-call `disableGraphics` via raw client (engine merges per-command config — v0 root field); ONE refresh after the script; structure patches stay live |
| 7 | Script died on `const top` (collided with sandbox shadow param) | Executor wraps user code in an inner async scope — own declarations may shadow the shadows |
| 8 | WASM rejections surfaced as `[object Object]` | Error normalization; envelope-shaped rejections resolve as envelopes (node parity) |
| 9 | ISO sheet looked "too thick" | Consumed CC_Solid containers (stale tool bodies) filtered out of getGraphic (owner join) |
| 10 | Sheet snapshots had no brep edges in the browser | Browser session lazily enables setDatabaseSettings (mirror of the node session) |
| 11 | `structure is not defined` in a proof script | DATA.md bounds row taught the un-prefixed call; fixed to `api.structure.…` + guard hint |
| 12 | `getObjectsLists` returned null in-app (3 script failures across runs) | Trained: method absent on older engines (51/1201 "Unknown command"); doc with result-guard + tree-scan fallback; **engine upgraded 21.0.0 → 21.2.0** (`@buerli.io/*` 1.0.1→1.1.0 in buerligons.io + starter.buerli.io; method now exists) |
| 13 | Tool chips expanded into a 200-char truncate | Per-tool detail: run_script = highlighted script + console + returned; docs = ✓/✗ key chips; generic = scrollable pretty JSON; snapshots open by default |
| 14 | Session-code panel reconstructed pseudo-code from call events | Panel shows collected run_script sources verbatim with separators (−249 lines codegen) |
| 15 | GT2 run 1 contaminated (prompt allowed prior sessions) | Strict source rule in benchmark files + spawn prompts |
| 16 | Old T35A40SS reference volume measured without bore/keyway | Benchmark #2 reference corrected to 12.0130 in³ |
| 17 | Reasoning-heavy round suffocated at EXACTLY 16000 output tokens, came back choiceless ('No choices') | Root cause: Copilot caps NON-streaming at max_non_streaming_output_tokens=16k. Chat providers now STREAM (SSE folded back to the response shape) → 64k cap, same as VS Code; choiceless responses map to max_tokens (auto-continue) |
| 18 | Copilot gateway hiccups (502 token exchange, {"error":"terminated"}) killed runs | Bounded 3-attempt provider retry with backoff; NOTE 2026-08-17 evening: GitHub major_outage (Copilot component down, VS Code affected too) — three bench-#2 aborts were GitHub-side, not stack-side |
| 19 | Panel showed only a bare "Thinking…" spinner | SSE carries delta.reasoning_text (plain-text thinking!) + reasoning_opaque; reasoning_text now surfaces as a real thinking block. usage reports prompt_tokens_details.cached_tokens — measure whether Copilot prompt-caches our contexts |
| 20 | OPEN: provider error drops the user message from history ("I don't have any record of the earlier request") | Fix candidate: keep the user turn in messages on error paths |
| 21 | OPEN: phantom build (a flange) appeared after a proxy restart | Suspected orphaned panel instance flushing a buffered request; one-off, not reproduced |
| 22 | OPEN (ENGINE, for Rainer): `v1.sketch.preTrim` on a constrained sketch (tangent flank endpoints COINCIDENT on a circle + construction circle/centerline crossings) never returns — native worker spun at 100% CPU with runaway memory for ~45 min, then the PROCESS DIED (took every session with it). Found by the mcp bench-#1 agent following SKETCHING step 5 verbatim ("Trim is safe on constrained sketches, verified 2026-06-10") | Worker restarted; agent resumed with a no-preTrim plan (closed the profile as a constraint chain — arc + tangent junctions, no trim needed) and passed. Repro attempt: [workspace/repro/2026-08-17-pretrim-hang/](../repro/2026-08-17-pretrim-hang/) — exact replay does NOT hang a fresh worker (6/6 clean); state-dependent, tracked as TODO.md #174 |
| 23 | `recipes/parametric-part` taught the SILENT NO-OP form `updateExpression({id,name,value})` (returns result=1, changes nothing) — mcp bench agent hit ΔV=0 on the live-bore proof, cross-checked the method doc, and self-corrected to `toUpdate:[{name,value}]` | Recipe fixed (both occurrences), bundle rebuilt; all other docs already showed the correct form (expression.md's bare form is its deliberate ❌ example) |
| 24 | Sheet/snapshot arcs render angular (mesh facets while brep edges stay smooth and poke out of the silhouette) — engine default faceting is `chordHeightTol 0.1` in MODEL UNITS (brutal for inch models: 0.1 in > a seat radius), and the params PERSIST WORKER-GLOBALLY across sessions. Same root as the bench-#2 probe confusion | Renderer: adaptive snapshot tessellation (chord = bboxDiag/3000 clamped, applied before the render fetch, previous worker params restored after; `quality:'fast'` opts out; skipped for pre-fetched graphic / recalc:false). verify-numerically recipe: tessellation-trap section (brep-exact probes or tighten+restore). Browser/buerligons snapshot path = follow-up candidate |
| 25 | MCP `run_script` → `api.graphic()` returned meshes but 0 EDGES until the first snapshot (renderSession) happened to enable the DB settings — the MCP session adapter was the ONE graphic path without the lazy `setDatabaseSettings` ensure (node + browser sessions both have it). Surfaced in ph's invite-session test; explains why the mcp bench agents probed mesh-only | `ensureGraphics` in the MCP script adapter, keyed on a new client reconnect `generation` (use_session lands in a new session that needs its own ensure); e2e-verified edges on first `api.graphic()` |
| 26 | Thinking was invisible WHILE streaming (bare pulsing dot; the reasoning only appeared as a collapsible block after the round folded) | LIVE THINKING TICKER: providers read the SSE body incrementally and emit reasoning/text deltas (`onDelta`); loop threads them as `onStreamDelta`; store keeps per-round `liveThinking`; panel shows a 3-line ghost ticker (column-reverse pins the newest line) that hands over to the collapsible block when the round lands |
| 27 | MCP `load` tool passed `content` — but the engine's parameter is `data` (`content` silently ignored → error 1004): the tool likely NEVER worked | Fixed (`data` + `doClear:1` per the common/load doc); found while adding `checkpoint`/`restore` to the MCP (parity with buerli-ai: named in-memory OFB rollback, per-reconnect-generation, e2e round-trip verified) |
| 28 | INTENT-vs-REFERENCE gap (ph's drawing-reproduction test, 2026-08-18): agent built a half-round tower MIRRORED (bulge facing the wrong way), noticed the difference in its own renders, rationalized it as "viewing angle", and passed — because the entire verification suite (volume/bounds/dims/solver states, 11/11 green) validates model==INTENT, never intent==REFERENCE. Its own post-mortem: "the sheet was treated as a formality, not a gate" | verify-numerically: new "Reference reproduction" section — per-view TOPOLOGY/ORIENTATION checklist extracted BEFORE building, each fact converted into a NUMERIC probe (material-presence/extents — orientation is measurable), reference's own views re-rendered and gated row by row; "different viewing angle" declared a non-explanation. Both host prompts carry the gate |

**Bench #2 × buerli-ai status (2026-08-17 evening):** three aborted attempts,
all GitHub-side (502 token exchange → choiceless 16k round → major_outage).
Copilot written off for the day (ph); restart when it recovers (status watcher
armed). Upgrades staged for the retry: streaming/64k, transient retry, live
thinking. Meanwhile: MCP benchmarks (Copilot-independent).

**Benchmark #3 candidate (ph, 2026-08-17):** a HUBBED variant — e.g. the
D35C13SS style-C from the 2026-08-10 training journal (double strand, hub
both sides, set screw). Adds revolve/hub geometry + set-screw features on top
of the plate skills. Parked until #2 is green on all hosts.

## E2E loop: the mirrored C-cut (2026-08-18/19) — perception vs. task context

ph's drawing-reproduction test (480×360 isometric, `hqdefault.jpg`) produced a
MIRRORED C-cut in 2 buerli-ai runs and 4 MCP runs — every run process-clean,
every run confidently wrong. Iterated the rules E2E against the real case
until the MCP run converged:

| It. | Rule state | Outcome | Finding |
| --- | --- | --- | --- |
| 0 | intent-gate only | mirrored | probes validated the misread premise |
| 1 | + drawing-reproduction recipe (record, callout anchors) | mirrored | silhouette impression overrode the agent's OWN callout anchor |
| 2 | + two-hypothesis adjudication, channel ranking | mirrored | "ribs land on flat faces" (mechanical prior) overrode a correct callout read |
| 3 | + mechanics demoted to tie-breaker, operational leader-crossing test | mirrored | model HALLUCINATED the leader trace to fit its gestalt |
| 4 | + 4× magnified crop supplied | mirrored | resolution alone doesn't fix it |
| — | perception probe battery | **crop 3/3, full 2/3 correct; in-task 0/6** | task context collapses perception; isolated forced-choice works |
| 5 | + perception-first pass in the recipe | mirrored | recipe fetched late/not at all — first image exposure ungoverned |
| 6 | + perception-first directive INLINE in host instructions | **CORRECT** | frozen record with pixel-measured chord segments (gap=30=Ø, walls=15), mirror answer committed pre-render |

Root cause: **not a knowledge gap and not resolution — task context.** Reading
a drawing while planning a build collapses onto a gestalt; every evidence
channel (silhouette, leader traces, mechanics) then confabulates to match.
The same model answers the isolated binary image-space question correctly.

The fix that converged (both hosts): the ALWAYS-present instructions order a
forced-choice perception pass at FIRST image exposure — one binary image-space
question per chirality-critical feature, pixel evidence, answers FROZEN —
before dimensions, docs, or planning; `recipes/drawing-reproduction` carries
the full protocol (record, adjudication, matched views, mirror check with
pre-render commitment, second reading).

Residual (n=1 at the converged state; genuine drawing ambiguities left for
ph to adjudicate): the "70" reading (straight-edge length vs center distance
— runs varied) and the bore/channel depth (through vs 15 deep — it. 6
pixel-measured 15). Renders: [files/c-cut-e2e-6/](files/c-cut-e2e-6/).

## Planned: unified `recipes/verification.md` (ph, 2026-08-18)

Merge verify-numerically (+ the drawing-reproduction protocol) into ONE
umbrella recipe whose entry point is the INPUT TYPE — the case decides the
regime:

- **Plain-text spec** (numbers in the prompt): the numeric tiers — mass
  properties, bounds, brep probes, parametric regen tests.
- **Technical drawing** (dimensions/callouts present): perception-first
  reference record (callout anchors, explicit chirality) → build → numeric
  replay of the record → matched-view renders → second reading.
- **Image/photo without dimensions**: no absolute numbers to check — verify
  topology, feature counts, proportions/aspect ratios; state the assumed
  scale explicitly.

Shared toolbox underneath: probes, tessellation trap, "success codes lie",
the second-reading rule. MANDATORY READING for every host: wired as a
non-optional part of the build fetch in the mcp initialize instructions, the
buerli-ai system prompt, AND the root-agent harness MDs (inherits the
"NOT optional" status verify-numerically has today; the alias layer keeps the
old keys serving). Do AFTER the c-cut E2E loop converges (changing the doc
landscape mid-experiment would confound it).

## Per-host takeaways

- **root agent**: the reference. Discovers everything from the repo MDs, one
  big script per stage, verifies inside the script. Anthropic-side prompt
  caching + native worker latency make the one-big-script strategy free.
- **buerli-ai**: same skill, same model — every gap was INFRASTRUCTURE, not
  intelligence. After the fixes it matches the GT run shape (1 pass, bulk
  docs round + 2 big build scripts + proofs). Remaining structural costs: no
  prompt caching via Copilot (every round re-sends the full context) and the
  WASM engine version lag (now 21.2.0). Watch: per-call graphic suppression
  relies on the v0 config-merge; when buerli exposes per-call config in
  createApi, switch to the official path.
- **mcp**: bench #1 PASSED 2026-08-17 (headless `claude -p` + stdio server,
  worker :9094). The instructions' method index worked as designed — the agent
  went straight to `describe_method` (8 calls) with no search flailing, then
  24 substantial run_scripts. Cleanest live-bore result of all hosts (0.013%).
  Distinguishing behavior: when the engine hung it TRIAGED (monitored the
  worker process, waited it out, wrote an interim report asking for a restart)
  — the resumed session rebuilt and passed in 4 minutes. Bench #2 PASSED the
  same evening in ONE clean 15-min pass (fresh agent): tightest root-radius
  proof of any host (brep-exact 2.2e-15) and volume within 0.027% of GT2.
  With both benchmarks green, mcp is the second host fully validated.
