# Training: construction geometry (`isConstruction`)

**Date:** 2026-07-01
**Trigger:** recently-merged feature; asked to find it, add renderer support, test all types + implications, doc it.

`isConstruction` (boolean, default `FALSE`) marks a sketch curve as **construction/reference geometry** — a
skeleton (axes, bolt circles, symmetry lines) that drives the real profile via constraints but is **not part of
the profile itself** and is **excluded from operations** (extrude).

## API surface (verified 2026-07-01)

**Creation — the flag is on every curve creator:**
- `sketch.line`, `sketch.circle`, `sketch.arcByCenter`, `sketch.arcBy3Points` → top-level `isConstruction`.
- `sketch.rectangle` → `isConstruction` flags all 4 lines.
- `sketch.geometry` (batch) → per sub-item: `lines[].isConstruction`, `circles[].isConstruction`,
  `arcsByCenter[].isConstruction`, `arcsBy3Points[].isConstruction`.
- **Points cannot be construction** — the flag is a curve property only.

**Toggle existing geometry:** `sketch.updateGeometry({ id, lines:[{ id, isConstruction:true|false }] })` flips it
**both ways** (verified `0→1→0`). Same for circles/arcs.

**Query:**
- `getGeometry` **includes** construction curves in its `lines`/`circles`/`arcs` arrays (NOT separated) — so you
  can't tell them apart from `getGeometry` alone.
- `getObjectsLists` returns a dedicated **`constructionGeometry: id[]`** (all construction ids) alongside the type lists.
- `getObjectInfo` returns per-object **`isConstruction: 0|1`** (also `isReference: 0|1`, a different concept).
- `getGlobalState` returns **`constructionCount`** (total); per-type counts (`lineCount` etc.) **include** construction.
- Structure tree: **`members.isConstruction.value`** = `1|0` (type `real`) on `CC_Line`/`CC_Circle`/`CC_Arc` — the renderer hook.

## Implications (verified)

- **It's a first-class constraint reference — that's its purpose.** A `TANGENT` between a normal circle (seeded at
  x=30, r=10) and a **construction** vertical axis at x=0 drove the solver to move the circle center to `[10,0]`
  (tangent). Construction geometry participates fully in constraints/dimensions; it just doesn't become material.
- **It is NOT actionable (can't extrude).** `part.extrusion` on a normal square → solid (result id, fast). On a
  **construction-only** square → **hangs the worker** (never returns; had to restart). Construction curves don't
  form an extrudable profile. Source guard: `PreCheckVisitor.cclass` rejects construction curves in an operation's
  region ("There is at least one construction curve …"), but a construction-ONLY reference wedges rather than
  erroring — **⚠️ never pass construction curves to `part.extrusion`.**

## Renderer support (implemented in `scripts/render-direct.mjs`)

`fetchSketchData` now reads `members.isConstruction.value` for each line/circle/arc and threads it through;
`renderSketchSVG` draws construction geometry **dashed, thin, violet `#a64dff`** (`stroke-dasharray="6,4"`,
`stroke-width="1.5"`) vs solid profile geometry. Verified across line/circle/arcByCenter/arcBy3Points and the
batch `geometry()` path (`files/02-mixed…png`, `files/04-alltypes…png`).

## Files
- `01-probe.mjs` — full surface (getGeometry/getObjectsLists/getObjectInfo/getGlobalState + tree member)
- `02-render.mjs` — renderer verification (square profile + construction diagonal/axis/bolt-circle/arc)
- `03a-toggle-ref.mjs` — updateGeometry toggle + construction-as-TANGENT-reference
- `03b-extrude-normal.mjs` / `03c-extrude-construction.mjs` — extrude works (normal) / hangs (construction-only)
- `04-alltypes.mjs` — arcBy3Points + batch geometry() construction
- Docs updated: line/circle/arcByCenter/arcBy3Points/rectangle/geometry/updateGeometry/getGeometry .md + SKETCHING.md
- Renderer: `scripts/render-direct.mjs` (harness, outer repo)
