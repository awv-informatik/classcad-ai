# TOOLS.md - Training Infrastructure

## Test Harness

The harness (`node scripts/run.mjs`) is a thin test runner. It connects to ClassCAD, runs your script, prints compact results to stdout, then clears and disconnects.

```bash
node scripts/run.mjs <script-path> --outdir <session-folder> [--debug] [--port <port>] [ws-url]
```

- Default WebSocket: `ws://0.0.0.0:9094/`
- `--port <port>` overrides the default port (e.g., `--port 9095`). Useful when the default port is occupied by a zombie worker.
- `--debug` disables all timeouts (connection + request) — useful when pausing in a debugger
- Scripts receive `api` from `@classcad/script` — `api.v1.<domain>.<method>(params)` (registry-validated, typos throw with suggestions; same envelope as before: `{ result, maxLevel, messages, structure, graphic }`), plus `api.tree({ refresh? })` and `api.graphic({ recalc? })` for structure- and GEOMETRY-level self-service (filter meshes/edges/vertices directly). Helpers: `{ snapshot, filewrite, tree }`. The same script medium runs in buerli-ai and the ClassCAD MCP.
- `snapshot('label')` saves PNG + STEP + OFB to `files/`
- `snapshot('label', opts)` — second arg forwards EVERY `@classcad/renderer` option. Camera: named views `'iso'|'top'|'bottom'|'front'|'back'|'left'|'right'` or `{ azimuth, elevation }` / `{ direction, up }`; `zoom`, `lookAt`. Verification toolkit: `section: { origin, normal }` (cut through internals), `sheet: true` (four labeled views, shared ortho scale), `highlight: [ids]` / `highlightAt: [[x,y,z]]` (face at a world point — use points, face-mesh ids are payload-local!), `markers: [{ position, label }]`, `sketchOverlay: true`, `annotate: true` (extents + triad + scale bar), `xray: true`, `colors: 'distinct'`, `frame` (pin an earlier render's frame for pixel-comparable before/after; frames ride on the returned entries), `layers`, `recalc: false` (MANDATORY in solid.*/EIF flows — recalc destroys injected bodies), `source: 'stl'` (explicit export-render fallback; the error message names it when graphic data is missing). **Default is still plain `'iso'` — options must earn their cost.**
- `filewrite(data, 'label')` dumps objects → `.json`, strings → `.txt`, buffers → `.bin` to `files/`
- All `console.log`/`.error`/`.warn` output is auto-captured to `<scriptName>.log` alongside `files/`
- Harness clears the drawing after each run — every script starts fresh

### Data available from API calls

Every `api.v1.<domain>.<method>()` call returns the full server envelope:

- `r.result` — the API return value (ID, object, VOID, etc.)
- `r.messages` — array of `{ message, level }` server messages
- `r.maxLevel` — highest message level (0=ok, 41-50=warning, 51+=error)
- `r.structure` — full object tree (feature tree, geometry nodes, parameters)
- `r.graphic` — rendering data (mesh vertices, normals, indices, edges)

**Use `filewrite` to persist `graphic` and `structure`** when studying geometry changes. Snapshots are visual aids, not proof — the renderer auto-scales, making size-only changes invisible. Vertex counts, bounding boxes, and feature tree diffs are the ground truth.

**The harness does NOT write your journal.** You write it. See `workspace/HOW-TO-TRAIN.md` for the full methodology.

## Skill Package (your deliverable)

Location: `knowledge/classcad-skill/`

- `SKILL.md` — master skill definition (cross-domain conventions, architecture)
- `references/*.md` — per-domain API documentation with AGENT NOTEs from training

This is a git submodule. To get the diff of your skill changes:

```bash
cd knowledge/classcad-skill && git diff references/ SKILL.md
```

## Reference Docs

| Source           | Location                                   | Purpose                                      |
| ---------------- | ------------------------------------------ | -------------------------------------------- |
| Skill references | `knowledge/classcad-skill/references/*.md` | Primary — your working docs with AGENT NOTEs |

## ClassCAD Server (classcad-cli)

The server should already be running — ph starts it manually. **Do not restart it unless the worker is confirmed hung** (100% CPU, calls timing out with no output).

If you must restart as a last resort:

```bash
# 1. Kill the hung worker
kill -9 $(ps aux | grep 'classcad-cli worker' | grep -v grep | awk '{print $2}')

# 2. Wait for it to die
sleep 2

# 3. Restart from its install directory
cd ~/dev/awv/classcad && ./runtime/output/arm64-osx-clang/release/classcad-cli worker &
```

> **Path note (2026-06-10):** the install tree moved from `/Users/dev/dev/osx` to
> `~/dev/awv/classcad` (binary under `runtime/output/arm64-osx-clang/release/`,
> `.classcad.ini` at the repo root). Older paths in this file and in memory are stale.

The worker listens on `ws://0.0.0.0:9094/` (the harness default). Give it ~3 seconds to initialize before running scripts.

**Common cause of hangs:** passing invalid values to APIs (e.g., `radius <= 0` to `curve.circle`, single/duplicate points to `interpolationCurve`). Diagnose with `ps aux | grep classcad` — a hung worker shows 100% CPU.

### Zombie worker recovery (alternate port)

If `kill -9` leaves the worker in UE (uninterruptible) state and the port stays occupied, start a new worker on an alternate port using the alternate INI file:

```bash
# Start worker on port 9095 instead
cd /Users/dev/dev/osx && ./arm64-osx-release/classcad-cli worker -i .classcad-alt.ini &

# Run scripts against it
node scripts/run.mjs <script> --outdir <dir> --port 9095
```

The file `/Users/dev/dev/osx/.classcad-alt.ini` is a copy of `.classcad.ini` with `wport=9095` and `hport=9095`. The zombie on port 9094 will clear when the machine reboots.

### Cleanup rule

**If you start a worker yourself, you must kill it when done.** Do not leave worker instances running after the session ends. Always:

```bash
# After all scripts are done, kill the worker you started
kill $(ps aux | grep 'classcad-cli worker' | grep -v grep | grep -v ' UE ' | awk '{print $2}')
```

The default worker on port 9094 is started by ph and should be left running. Only kill workers you explicitly started (typically on alternate ports).

## Rendering

The harness uses `@classcad/renderer` (workspace package `../renderer`) which auto-detects content:

- Solids → mesh projection (default isometric, see view options)
- Sketches → 2D plot
- Curves → edge data plot

Snapshots are PNG files in `files/`. They show wireframe/outline views — not photorealistic. Interior cavities (e.g., subtraction holes) may not be visible from all angles — that's a reason to take a second snapshot from a different `view`, not a reason to give up.

> **Arc rendering (fixed 2026-07-01).** The sketch renderer used to draw every arc as its **minor (<180°) sweep**,
> ignoring the arc's `bulge` — so a *major* arc (e.g. the outer arc of a union of two circles) rendered as its
> minor-arc complement, making a union blob look like an intersection lens. The renderer now reads each
> arc's signed `bulge` from the structure tree and derives the correct sweep in `tessellateArc`. If you see a
> pre-2026-07-01 arc snapshot, distrust it for anything with arcs ≥180°. General rule that caught this: **when a
> snapshot contradicts your numbers, measure the geometry (an arc's `bulge` = tan(includedAngle/4)) — don't trust
> the picture.**

### View options

`snapshot('label', { view, zoom, lookAt })` accepts a CAD view-cube selector:

| view | Camera | Best for |
|---|---|---|
| `'iso'` (default) | corner view, all three axes visible | overall shape, where things are roughly placed |
| `'top'` | down -Z | broad face of an XY-plane part, hole on top |
| `'bottom'` | up +Z | hole/feature on the underside |
| `'front'` | +Y | side profile (XZ projection) |
| `'back'` | -Y | opposite side profile |
| `'right'` | -X | YZ profile from the right |
| `'left'` | +X | YZ profile from the left |

`zoom` is a fit-multiplier; >1 zooms in tighter. `lookAt: [x, y, z]` re-anchors the screen center to a specific world point — useful when you're zoomed in on a feature off-axis from the bounding-box center.

**When to use multiple views.** Reach for an extra view when a single iso snapshot is ambiguous: a through-hole pierces the plate but iso shows it edge-on; a constraint repositions an instance but the change is along a hidden axis; two bodies overlap in iso but you can't tell which is in front. Take iso first, then add the view that exposes the specific spatial fact you need to confirm. **Default is still iso — pick extra views deliberately, not by reflex.**

### Assembly rendering

The renderer composes per-instance world transforms by walking `CC_ProductReference` / `CC_ProductReferenceET` nodes. Every leaf instance renders at its assembly-frame position; instances of the same template share a color (palette is keyed by template, not by container).

Drawings without an assembly root render flat (one drawcall per container) — backwards-compatible with all part-only training scripts.

**Historical note:** before the 2026-05-01 port, the cc renderer ignored instance transforms and drew every instance at the template origin. All assembly snapshots taken before that date are stacked-at-origin and unreliable for spatial verification. Numeric measurements (`calculateMassProperties`, `getGeometryPositions`) were not affected.

### Snapshot filename convention

`snapshot('label')` does NOT produce `{scriptName}-{label}.png`. The renderer appends a **content-type suffix** based on what it finds in the drawing:

| Content type | Suffix | Example |
|---|---|---|
| Solids | `-solid` | `01-basic-solid.png` |
| Sketches | `-sketch-{SketchName}` | `01-basic-sketch-Sketch.png` |
| Curves | `-curves` | `01-basic-curves.png` |
| Work geometry | `-workgeo` | `01-basic-workgeo.png` |

A single `snapshot()` call may produce **multiple PNGs** (e.g., one for the solid and one for work geometry). The actual filenames are logged to stdout (captured in the `.log` file). **Always check the `.log` file or `ls files/*.png` before writing image links in the journal.**
