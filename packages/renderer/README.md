# @classcad/renderer

Renderer for [ClassCAD](https://classcad.ch)/[buerli](https://buerli.io) session
data — solids, constrained sketches, curves, and work geometry. Same input →
same image: fixed CAD views, auto-fit framing, no camera state, no GPU. Built
for agents and pipelines that need to *verify* geometry visually — not for
interactive display.

![Views and verification toolkit — iso, first- and third-angle drawings, line style, section, diff, sheet, highlight/markers, sketch overlay, annotate, x-ray](docs/gallery.png)

## Install

```bash
npm install @classcad/renderer          # + sharp, if you use the node adapter
```

| Entry point | Environment | Contents |
| --- | --- | --- |
| `@classcad/renderer` (= `./core`) | browser + Node, zero deps | all rendering — start with [`renderSessionData`](#rendersessiondatasource-options) |
| `./node` | Node, needs `sharp` | PNG encode/save + the file-based [`renderSession`](#rendersessionclient-prefix-outdir-options) |
| `./browser` | browser, zero deps | canvas PNG encoding |
| `./stl` | anywhere | STL parsing + legacy triangle renderer |

Every export carries TSDoc — hover any function or option field in your editor
for the same documentation as below.

## Quick start

```js
// Node (MCPs, harnesses, CI) — render a live session to PNG files
import { renderSession } from '@classcad/renderer/node'
const files = await renderSession(client, 'part', './out', { view: 'iso', annotate: true })
```

```js
// Browser (buerli-ai, custom apps) — pure data in, base64 PNG out
import { renderSessionData } from '@classcad/renderer'
import { entryToPngBase64 } from '@classcad/renderer/browser'
const entries = await renderSessionData({ tree, graphic, execute }, { view: 'front' })
const png = await entryToPngBase64(entries[0])
```

---

## Views and projections

The world is **Z-up**, like ClassCAD. Every camera is orthographic; a render
never depends on camera state.

| Camera | Looks from | Shows |
| --- | --- | --- |
| `'iso'` (default) | the front-right-top corner (+X, −Y, +Z) | front, right and top faces |
| `'front'` / `'back'` | −Y / +Y | the XZ plane |
| `'right'` / `'left'` | +X / −X | the YZ plane |
| `'top'` / `'bottom'` | +Z / −Z | the XY plane |
| `{ azimuth, elevation }` | a turntable position in degrees: azimuth 0 = front, 90 = +X; elevation 90 = top | anything in between |
| `{ direction, up? }` | an explicit look direction | anything |

A named view and a vector camera aimed the same way give the same image
(`'iso'` = `{ azimuth: 45, elevation: 35.264 }`, `'right'` = `{ azimuth: 90 }`).
Views are never mirrored.

**Technical drawings** (`drawing`) place front, top and side view by an ISO
5456-2 projection method. The views are identical in both methods; only their
placement differs:

| `drawing` | Top view | Side view right of the front view | Used in |
| --- | --- | --- | --- |
| `'first-angle'` (`true`) | below the front view | seen from the LEFT | Europe (ISO E) |
| `'third-angle'` | above the front view | seen from the RIGHT | US, ASME Y14.3 (ISO A) |

The drawing views use the line style (`lines`): visible edges and silhouettes
solid, hidden ones dashed — the hidden lines show bores, pockets and hollow vs
solid, which a shaded view cannot.

## API — core (`@classcad/renderer`)

### `renderSessionData(source, options?)`

`(source: SessionSource, options?: RenderOptions) => Promise<SessionEntry[]>`

Renders every visible content type from session **data** — auto-detected from
the structure tree: solids (z-buffer raster, assemblies placed via their
composed `coordinateSystem` transforms), sketches (2D SVG with dimensions,
constraint badges and label de-overlap), curves, and work geometry.

**`source` — SessionSource:**

| Field | Type | Description |
| --- | --- | --- |
| `tree` | object | structure tree (`GetTree` → `structure.tree`). Required. |
| `graphic` | object \| null | graphic payload with `containers` (recalc response or accumulated client graphic). Required for solid/curve renders. Brep **edges** are only present when the session had `v1.common.setDatabaseSettings({ isGraphicEnabled: true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation: true })`. |
| `execute` | function | optional. Harness-task executor `execute({ 'v1.sketch.getGeometry': [{ id }] }) → { result }`; enables sketch renders and `sketchOverlay`. |

**Returns** an array of entries:

| `type` | `kind` | Payload |
| --- | --- | --- |
| `'solid'` | `pixels` | `pixels` (RGBA), `width`, `height`, `frame` |
| `'sheet'` | `pixels` | same, when `options.sheet` is set |
| `'drawing'` | `pixels` | same, when `options.drawing` is set |
| `'sketch'` | `svg` | `svg`, `sketchId`, `name` |
| `'curves'` / `'workgeo'` | `svg` | `svg` |

### `RenderOptions` — the complete configuration object

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `width` | number | `1600` | image width in pixels |
| `height` | number | `1200` | image height in pixels |
| `view` | CameraView | `'iso'` | named view (`iso, top, bottom, front, back, left, right`; Z-up, `iso` looks from the front-right-top corner = `{ azimuth: 45, elevation: 35.264 }`) **or** an arbitrary orthographic camera: `{ azimuth, elevation }` (degrees, Z-up turntable; 0/0 = front) or `{ direction: [x,y,z], up? }`. A named view and a vector camera aimed the same way give the same image (`'right'` = `{ azimuth: 90 }`) — views are never mirrored. |
| `zoom` | number | `1` | multiplier on the auto-fit scale (>1 zooms in). Ignored when `frame` is set. |
| `lookAt` | `[x,y,z]` | — | world point that lands at the image center. Ignored when `frame` is set. |
| `frame` | Frame | — | pin the frame (`{ scale, midX, midY }`) returned by an earlier render of the same view/size: fixes scale AND center so before/after renders are pixel-comparable — the precondition for [`diffImages`](#diffimagesa-b-opts). Overrides auto-fit, `zoom`, `lookAt`. |
| `colors` | `'native'` \| `'distinct'` | `'native'` | `'native'` = the model's own ClassCAD colors (face-mesh material, then container material; no material → palette fallback). `'distinct'` = one palette color per body — use to tell bodies apart in booleans, splits, patterns, assemblies of identical parts. |
| `section` | `{ origin: [x,y,z], normal: [x,y,z], cap? }` | — | cut the solids at a plane: everything on the **positive** side of `normal` is removed. The cut faces are capped: filled and hatched at 45° like a drawing's section (adjacent bodies alternate the direction), outlined as edges; bores and pockets stay open. `cap: false` leaves the cut open — interior walls visible, shaded darker. Framing stays that of the uncut model. |
| `highlight` | number[] | — | ids rendered in signal orange (faces/bodies) or signal red (edges). Matches graphic container ids, owning solid ids (`container.owner`), face mesh ids, edge ids. Unmatched ids are no-ops. |
| `markers` | `{ position: [x,y,z], label?, color? }[]` | — | probe markers: crosshair + label at world coordinates, drawn on top of everything (no depth test). |
| `sketchOverlay` | boolean | `false` | draw every sketch's curves in 3D — world coordinates, on the sketch's actual plane — over the solid render. Construction geometry dashes violet. Needs `execute`; renders standalone (on white) without solid geometry. |
| `annotate` | boolean | `false` | measurement overlay: bounding-box extents (`X x Y x Z`, model units), RGB axes triad oriented like the current view (into-screen axes omitted), scale bar with a round model-unit length. |
| `xray` | boolean | `false` | translucent bodies (painter's blend, far-to-near): hidden bodies and internal far walls shine through; edges stay opaque. |
| `xrayAlpha` | number | `0.42` | blend alpha for `xray` (0–1 exclusive). |
| `sheet` | boolean \| CameraView[4] | `false` | render the solids as ONE four-view image (quadrants TL/TR/BL/BR; `true` = top/iso/front/right). Ortho views share one scale like a technical drawing; labels use the built-in font. Entry `type` becomes `'sheet'`. |
| `lines` | boolean | `false` | line style (hidden-line drawing) instead of shading: visible edges and silhouettes solid, hidden ones dashed, no fill. Silhouettes of curved faces are computed from the mesh; seam edges are left out. Hidden lines show internal structure — bores, pockets, hollow vs solid. Applies to the single-view render and every `sheet` panel. |
| `drawing` | boolean \| `'first-angle'` \| `'third-angle'` \| `{ projection?, side?, iso? }` | `false` | render the solids as a TECHNICAL DRAWING: front, top and side view in line style, placed by projection method, aligned, one shared scale; a shaded iso fills the free quadrant, which also names the method. **First-angle** (ISO E, Europe; `true`): top view below the front view, view from the left right of it. **Third-angle** (ISO A, US): top view above, view from the right right of it. `side` picks the other side view (its placement follows the method); `iso: false` leaves the quadrant empty. Takes precedence over `sheet`. Entry `type` becomes `'drawing'`. |

All features compose — a sectioned x-ray sheet with markers is valid.

### `diffImages(a, b, opts?)`

`(a, b: { pixels, width, height }, opts?: { tolerance?: number }) => DiffResult`

Pixel-compares two same-size renders. Meaningful only with a **pinned frame**
(`options.frame`) — auto-fit reframes when geometry changes, which would make
every pixel "differ". Throws on size mismatch.

Returns `{ changed, total, fraction, bbox, pixels, width, height }` — `bbox`
is the changed region (or `null`), `pixels` a visualization: unchanged content
faded to gray, changed pixels red.

```js
const [before] = await renderSessionData(src, {})
// …modify the model…
const [after] = await renderSessionData(src2, { frame: before.frame })
const d = diffImages(before, after)   // d.fraction, d.bbox, d.pixels
```

### Low-level renderers

| Function | Signature | Description |
| --- | --- | --- |
| `renderSolidZBuffer` | `(graphic, width?, height?, instances?, opts?) => RasterResult \| null` | the z-buffer solid rasterizer behind `renderSessionData`. Camera from `setViewport`; `opts` is a `RenderOptions` subset plus `overlays: OverlayPolyline[]`. |
| `renderSolidSheet` | `(graphic, width?, height?, instances?, opts?) => RasterResult \| null` | the four-view sheet compositor (`opts.views` picks the quadrants). |
| `renderSolidDrawing` | `(graphic, width?, height?, instances?, opts?) => RasterResult \| null` | the technical-drawing layout behind `options.drawing`. |
| `setViewport` | `({ view?, zoom?, lookAt?, frame? }) => void` | configures the camera for subsequent low-level render calls. `renderSessionData` calls it internally. |
| `renderSketchSVG` | `(items, width?, height?, dimensions?, constraints?, posMap?) => string \| null` | 2D sketch renderer (dimensions, constraint badges, label de-overlap). |
| `renderCurveSVG` | `(graphic, width?, height?) => string \| null` | tessellated 2D curve shapes. |
| `renderWorkGeoSVG` | `(workGeo, width?, height?) => string \| null` | work planes/axes/points/csys triads. |

### Data helpers

| Function | Signature | Description |
| --- | --- | --- |
| `analyzeSession` | `(tree) => { solids, sketches, curves, eifs, workGeo }` | node ids per content category (built-in planes/axes excluded). |
| `extractAssemblyInstances` | `(tree) => instances \| null` | one entry per live solid of every leaf part instance, with cumulative world transforms; `null` for non-assemblies. |
| `graphicWithEdges` | `(graphic) => graphic` | a saved SCG file (`v1.common.save({ format: 'SCG' })`) keeps analytic brep edges in `lines` + `arcs` and only free-form edges in `edges`; returns a graphic whose containers carry all of them as `edges`. `renderSessionData` applies it itself, so `{ tree: scg.structure.tree, graphic: scg.graphic }` renders with edges. |
| `fetchSketchData` | `(execute, sketchId, tree?) => Promise<{ items, posMap } \| null>` | one sketch's geometry with WORLD-coordinate positions. |
| `sketchToOverlays` | `(items, sketchNode) => OverlayPolyline[]` | sketch geometry → 3D overlay polylines (plane normal derived from the geometry itself). |
| `extractDimensions` / `extractConstraints` | `(tree, sketchId) => …` | dimension / constraint data for the 2D sketch renderer. |
| `drawText` / `measureText` | `(pixels, w, h, x, y, text, color?, scale?)` / `(text, scale?)` | built-in 5×7 bitmap font (uppercased; deterministic). |
| `VIEW_NAMES` / `COLOR_MODES` | `string[]` | the named views / color modes. |

---

## API — node adapter (`@classcad/renderer/node`)

Re-exports the entire core, plus:

### `renderSession(client, prefix, outDir, options?)`

`(client, prefix: string, outDir: string, options?) => Promise<RenderedFile[]>`

The file-based, harness-compatible entry: ensures the graphic database
settings (so **edges** are included), fetches tree + graphic from the live
client, delegates to `renderSessionData`, encodes and writes PNGs
(`<prefix>-solid.png`, `<prefix>-sheet.png`, `<prefix>-sketch-<name>.png`, …).

**Fails loudly:** if the session contains solids/curves but no graphic data
arrived (e.g. a client connected with graphics fully disabled), it **throws**
with the cause and the remedies — never a silent empty render.

Takes all of [`RenderOptions`](#renderoptions--the-complete-configuration-object), plus:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `recalc` | boolean | `false` | Pull current graphics without regeneration. Set true explicitly to regenerate. **`common.recalc` destroys entity-injection (direct-modeling) bodies** — pass `false` for `solid.*`/EIF sessions. |
| `ensureGraphics` | boolean | `true` | set the graphic database settings first (required for brep edges). |
| `source` | `'graphic'` \| `'stl'` | `'graphic'` | `'stl'` renders the tessellated **STL export** through the same z-buffer/view pipeline instead of the engine graphic — the explicit opt-in fallback for graphics-disabled clients, and an independent check of what the exported file actually contains. Never chosen automatically; marked `source: 'stl'` in the result; no brep edges. |

```js
await renderSession(client, 'detail', './out', { view: 'front', zoom: 3, lookAt: [0, 0, 25] })
await renderSession(client, 'check', './out', { source: 'stl' })   // explicit STL fallback
```

### Node helpers

| Function | Signature | Description |
| --- | --- | --- |
| `fetchGraphic` | `(client, { recalc? }?) => Promise<graphic>` | Pull current graphics; regeneration is opt-in. Refresh failures propagate instead of returning stale cached geometry. |
| `pixelsToPng` | `(pixels, w, h) => Promise<Buffer>` | RGBA → PNG bytes (sharp). |
| `savePNG` | `(pixels, w, h, path) => Promise<void>` | RGBA → PNG file. |
| `svgToPngBuffer` | `(svg) => Promise<Buffer>` | SVG → PNG bytes. |
| `svgToPng` | `(svg, path) => Promise<void>` | SVG → PNG file. |

---

## API — browser adapter (`@classcad/renderer/browser`)

Re-exports the entire core, plus canvas-based encoding (no dependencies;
OffscreenCanvas with DOM-canvas fallback):

| Function | Signature | Description |
| --- | --- | --- |
| `entryToPngBase64` | `(entry: SessionEntry) => Promise<string>` | encode one `renderSessionData` entry (pixels or svg) as base64 PNG. |
| `pixelsToPngBase64` | `(pixels, w, h) => Promise<string>` | RGBA → base64 PNG (no `data:` prefix). |
| `svgToPngBase64` | `(svg, w?, h?) => Promise<string>` | SVG string → base64 PNG. |

---

## API — STL (`@classcad/renderer/stl`)

Renders what an **exported STL file** contains — independent of the graphic
pipeline. Useful for export verification and graphics-disabled clients (the
node adapter's `source: 'stl'` builds on this).

| Function | Signature | Description |
| --- | --- | --- |
| `parseSTL` | `(buf) => { normal, vertices }[]` | parse a binary STL buffer into triangles. |
| `renderIsometric` | `(triangles, w, h) => pixels` | legacy flat-shaded isometric render with triangle wireframe. For view/option-aware output, convert the triangles to a graphic container and use `renderSolidZBuffer`. |

---

## Notes

- **Edges need database settings.** The engine includes brep edge data in
  graphic containers only after `v1.common.setDatabaseSettings({ isGraphicEnabled:
  true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation:
  true })`. The node adapter's `renderSession` sets this automatically
  (`ensureGraphics: false` to skip); when feeding `renderSessionData` yourself,
  make sure the session had these settings before the graphic was produced.
- **Gallery.** `docs/gallery.png` is rendered live from real session data:
  `node scripts/run.mjs packages/renderer/docs/gallery.mjs` from the
  classcad-ai root, with a ClassCAD worker on `:9094`.
- **Curve rendering** covers the first curve per shape container (the server
  pushes graphic data only for that one); use one shape per curve when visual
  verification matters.
