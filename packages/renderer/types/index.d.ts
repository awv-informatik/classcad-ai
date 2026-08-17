// Type declarations for @classcad/renderer.
// All entry points share this surface; node-only and browser-only helpers are
// marked in their doc comments. TSDoc here is the IDE-hover documentation —
// keep it in sync with the README API reference.

/** A 3D point or vector in world coordinates: `[x, y, z]`. */
export type Vec3 = [number, number, number]

/** An RGB color: `[r, g, b]`, each channel 0–255. */
export type RGB = [number, number, number]

/**
 * A view frame: projection scale plus the projected-space center. Every raster
 * render reports the frame it used; pass it back via {@link RenderOptions.frame}
 * to pin later renders of a CHANGED model to the same scale and center, making
 * before/after images pixel-comparable (see {@link diffImages}).
 */
export interface Frame {
  /** Screen pixels per projected model unit. */
  scale: number
  /** Projected-space x that maps to the horizontal image center. */
  midX: number
  /** Projected-space y that maps to the vertical image center. */
  midY: number
}

/** RGBA pixel result of a raster render. */
export interface RasterResult {
  /** Row-major RGBA, `width * height * 4` bytes (Buffer in Node, Uint8Array in browsers). */
  pixels: Uint8Array
  width: number
  height: number
  /** The view frame this render used — reusable via {@link RenderOptions.frame}. */
  frame: Frame | null
}

/**
 * The camera. Either a named CAD view-cube view, or an arbitrary orthographic
 * camera:
 * - `{ azimuth, elevation }` — turntable angles in DEGREES, Z-up world.
 *   `azimuth: 0` = front (camera at −Y), `90` = camera at +X, CCW about +Z.
 *   `elevation: 0` = horizon, `90` = straight down (top).
 * - `{ direction, up? }` — explicit look direction (from camera toward the
 *   scene); `up` defaults to `[0, 0, 1]`.
 *
 * Named views follow CAD drawing conventions; vector cameras use the
 * photographic convention (e.g. `'right'` and `{ azimuth: 90 }` are mirror
 * images of each other).
 */
export type CameraView =
  | 'iso' | 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right'
  | { azimuth?: number; elevation?: number }
  | { direction: Vec3; up?: Vec3 }

/**
 * A cutting plane for section views. Everything on the POSITIVE side of the
 * normal is removed. The cut is uncapped: interior walls become visible and
 * are shaded darker. Framing stays that of the UNCUT model, so sectioned and
 * unsectioned renders of the same state are directly comparable.
 */
export interface SectionPlane {
  /** A point on the plane, world coordinates. */
  origin: Vec3
  /** Plane normal; the positive half-space is cut away. Need not be unit length. */
  normal: Vec3
}

/**
 * A probe marker: crosshair + optional label at a world position, drawn on top
 * of everything (no depth test). Use to visualize the probe points of numeric
 * verification.
 */
export interface Marker {
  /** World position of the crosshair center. */
  position: Vec3
  /** Optional text drawn beside the crosshair (built-in bitmap font, uppercased). */
  label?: string
  /** Marker color. @defaultValue `[220, 30, 30]` */
  color?: RGB
}

/** A world-space polyline drawn on top of the solid render (no depth test). */
export interface OverlayPolyline {
  /** Polyline vertices in world coordinates (≥ 2 points). */
  pts: Vec3[]
  /** Stroke color. @defaultValue `[0, 90, 220]` */
  color?: RGB
  /** Dashed stroke (6 px on / 4 px off, screen space). @defaultValue `false` */
  dashed?: boolean
}

/**
 * Options accepted by {@link renderSessionData}, {@link renderSolidZBuffer}
 * and (with additions) the node adapter's {@link renderSession}. All features
 * compose freely — e.g. a sectioned x-ray sheet with markers is valid.
 */
export interface RenderOptions {
  /** Image width in pixels. @defaultValue `1600` */
  width?: number
  /** Image height in pixels. @defaultValue `1200` */
  height?: number
  /** Camera: named view or arbitrary orthographic camera. @defaultValue `'iso'` */
  view?: CameraView
  /** Multiplier on the auto-fit scale (>1 zooms in). Ignored when `frame` is set. @defaultValue `1` */
  zoom?: number
  /** World point that lands at the image center (instead of the bbox center). Ignored when `frame` is set. */
  lookAt?: Vec3
  /**
   * Pin the view frame of an earlier render (same view + image size): fixes
   * scale AND center so renders of different model states stay
   * pixel-comparable — the precondition for {@link diffImages}. Overrides
   * auto-fit, `zoom` and `lookAt`.
   */
  frame?: Frame
  /**
   * `'native'` renders the model's own ClassCAD colors (face-mesh material
   * first, then container material; bodies without material fall back to the
   * palette). `'distinct'` ignores materials and gives every body its own
   * palette color — use it to tell bodies apart in booleans, splits, patterns
   * and assemblies of identical parts. @defaultValue `'native'`
   */
  colors?: 'native' | 'distinct'
  /** Cut the solids at a plane — see {@link SectionPlane}. */
  section?: SectionPlane
  /**
   * Ids rendered in signal orange (faces/bodies) or signal red (edges).
   * Matched against graphic container ids, owning solid ids
   * (`container.owner`), face mesh ids and edge ids. Unmatched ids are
   * no-ops. Makes "which face/edge/body is id N?" visible.
   */
  highlight?: number[]
  /** Probe markers drawn on top of the render — see {@link Marker}. */
  markers?: Marker[]
  /**
   * Draw every sketch's curves in 3D — world coordinates, on the sketch's
   * actual plane — on top of the solid render. Construction geometry dashes
   * violet. Verifies a sketch sits on the intended plane at the intended
   * place. Requires {@link SessionSource.execute}; without solid geometry the
   * overlay renders standalone on white. @defaultValue `false`
   */
  sketchOverlay?: boolean
  /**
   * Measurement overlay: world bounding-box extents (`X x Y x Z`, model
   * units, bottom right), an RGB axes triad oriented like the current view
   * (bottom left; axes pointing into the screen are omitted), and a scale bar
   * with a round model-unit length (bottom center). @defaultValue `false`
   */
  annotate?: boolean
  /**
   * Translucent bodies (painter's blend, far-to-near, no depth rejection):
   * hidden bodies and internal far walls shine through; edges stay fully
   * opaque. Back faces remain culled for readability. @defaultValue `false`
   */
  xray?: boolean
  /** Blend alpha for `xray` (0–1 exclusive). @defaultValue `0.42` */
  xrayAlpha?: number
  /**
   * Render the solids as a FOUR-VIEW SHEET: one image with quadrants TL, TR,
   * BL, BR. `true` = `['top', 'iso', 'front', 'right']`; pass an array of 4
   * views to pick the quadrants. Ortho views share ONE scale like a technical
   * drawing; iso/custom cameras auto-fit themselves. Labels use the built-in
   * font. The session entry's `type` becomes `'sheet'`. @defaultValue `false`
   */
  sheet?: boolean | CameraView[]
}

/**
 * The data a render needs. All three fields are injectable, which is what
 * makes the core portable: a Node harness, an MCP, and a browser app feed the
 * same shapes from their own sources.
 */
export interface SessionSource {
  /** Structure tree (`GetTree` → `structure.tree`). */
  tree: Record<string, unknown>
  /**
   * Graphic payload with `containers` (from a recalc response or an
   * accumulated client graphic). Required for solid/curve renders. NOTE: the
   * engine includes brep EDGE data only after
   * `v1.common.setDatabaseSettings({ isGraphicEnabled: true, isCCGraphicEnabled:
   * true, isSketchGraphicEnabled: true, doCurveTessellation: true })` — without
   * it, solids render without their edge overlay.
   */
  graphic?: { containers?: unknown[] } | null
  /**
   * Harness-task-style executor:
   * `execute({ 'v1.sketch.getGeometry': [{ id }] })` → `{ result }`.
   * Enables sketch renders and `sketchOverlay`; omit to skip sketches.
   */
  execute?: (task: Record<string, unknown[]>) => Promise<{ result?: unknown }>
}

/** One rendered artifact from {@link renderSessionData}. */
export type SessionEntry =
  | ({ type: 'solid' | 'sheet'; kind: 'pixels' } & RasterResult)
  | { type: 'sketch'; kind: 'svg'; svg: string; sketchId: number; name: string }
  | { type: 'curves' | 'workgeo'; kind: 'svg'; svg: string }

/**
 * Render every visible content type from session DATA — the portable heart of
 * the package (browser + Node, no dependencies). Auto-detects solids,
 * sketches, curves and work geometry from the structure tree and returns one
 * entry per rendered artifact.
 *
 * @param source - tree + graphic + optional executor, see {@link SessionSource}
 * @param options - see {@link RenderOptions}
 * @example
 * const [solid] = await renderSessionData({ tree, graphic }, { view: 'front', annotate: true })
 * // solid.pixels (RGBA), solid.frame (pin for a later diff)
 */
export function renderSessionData(source: SessionSource, options?: RenderOptions): Promise<SessionEntry[]>

/** Result of {@link diffImages}. */
export interface DiffResult {
  /** Number of differing pixels. */
  changed: number
  /** Total pixels compared (`width * height`). */
  total: number
  /** `changed / total`. */
  fraction: number
  /** Bounding box of the changed pixels, or `null` when nothing changed. */
  bbox: { minX: number; minY: number; maxX: number; maxY: number } | null
  /** Visualization: unchanged content faded to gray, changed pixels red. */
  pixels: Uint8Array
  width: number
  height: number
}

/**
 * Compare two same-size RGBA renders pixel by pixel. Meaningful ONLY when
 * both were rendered with the same view/size and a PINNED frame
 * ({@link RenderOptions.frame}) — auto-fit reframes when geometry changes,
 * which would make every pixel "differ".
 *
 * @param a - the before image
 * @param b - the after image
 * @param opts - `tolerance`: per-channel absolute tolerance (default 0)
 * @throws when the image sizes differ
 * @example
 * const [before] = await renderSessionData(src, { width: 800, height: 600 })
 * // …modify the model…
 * const [after] = await renderSessionData(src2, { width: 800, height: 600, frame: before.frame })
 * const d = diffImages(before, after) // d.fraction, d.bbox, d.pixels
 */
export function diffImages(
  a: Pick<RasterResult, 'pixels' | 'width' | 'height'>,
  b: Pick<RasterResult, 'pixels' | 'width' | 'height'>,
  opts?: { tolerance?: number },
): DiffResult

/** The named view-cube views: `iso, top, bottom, front, back, left, right`. */
export const VIEW_NAMES: string[]

/** The color modes: `native, distinct` — see {@link RenderOptions.colors}. */
export const COLOR_MODES: string[]

/**
 * Configure the viewport for subsequent low-level render calls
 * ({@link renderSolidZBuffer}, SVG renderers). {@link renderSessionData} and
 * {@link renderSolidSheet} call this internally from their options — you only
 * need it when driving the low-level renderers directly.
 */
export function setViewport(opts?: { view?: CameraView; zoom?: number; lookAt?: Vec3; frame?: Frame }): void

/**
 * Low-level z-buffer solid rasterizer (per-pixel depth test, back-face
 * culling, per-body palette or native materials, edge overlay). Prefer
 * {@link renderSessionData}; use this directly for custom pipelines. Camera
 * comes from {@link setViewport}; feature options (colors/section/highlight/
 * markers/xray/annotate/overlays) from the last parameter.
 *
 * @param graphic - graphic payload with `containers`
 * @param instances - assembly instances from {@link extractAssemblyInstances}, or null
 * @param opts - a {@link RenderOptions} subset, plus `overlays` ({@link OverlayPolyline}[]);
 *   a plain color-mode string is also accepted
 * @returns raster result, or `null` when there is nothing to draw
 */
export function renderSolidZBuffer(
  graphic: { containers?: unknown[] },
  width?: number,
  height?: number,
  instances?: unknown[] | null,
  opts?: (RenderOptions & { overlays?: OverlayPolyline[] }) | string,
): RasterResult | null

/**
 * Render four views of the solids into ONE image (quadrants TL, TR, BL, BR) —
 * the engine behind {@link RenderOptions.sheet}. Ortho views share one scale;
 * iso/custom cameras auto-fit themselves.
 */
export function renderSolidSheet(
  graphic: { containers?: unknown[] },
  width?: number,
  height?: number,
  instances?: unknown[] | null,
  opts?: { views?: CameraView[] } & RenderOptions,
): RasterResult | null

/**
 * Scan a structure tree for renderable content. Returns the node ids per
 * category (work geometry excludes the built-in planes/axes).
 */
export function analyzeSession(tree: Record<string, unknown>): {
  solids: number[]; sketches: number[]; curves: number[]; eifs: number[]; workGeo: number[]
}

/**
 * Walk an assembly tree and produce one entry per leaf part instance with its
 * cumulative world transform (composed `coordinateSystem`s). Returns `null`
 * for non-assembly drawings — {@link renderSolidZBuffer} then renders each
 * container once at identity.
 */
export function extractAssemblyInstances(tree: Record<string, unknown>): unknown[] | null

/**
 * Fetch one sketch's geometry with WORLD-coordinate positions via the
 * executor (`getGeometry`/`getPositions`/`getPoints` queries). The result
 * feeds {@link sketchToOverlays} and the 2D sketch renderer.
 */
export function fetchSketchData(
  execute: SessionSource['execute'],
  sketchId: number,
  structureTree?: Record<string, unknown>,
): Promise<{ items: unknown[]; posMap: Record<string, unknown> } | null>

/**
 * Turn one sketch's geometry ({@link fetchSketchData} items) into 3D overlay
 * polylines. Circles/arcs are tessellated in the sketch plane — the normal is
 * derived from the sketch's own geometry (two independent in-plane
 * directions), with the node's coordinateSystem as circle-only fallback.
 */
export function sketchToOverlays(items: unknown[], sketchNode: unknown): OverlayPolyline[]

/**
 * Draw text into an RGBA buffer with the built-in 5×7 bitmap font
 * (deterministic, dependency-free; input is uppercased, unknown characters
 * render as spaces). Returns the drawn width in pixels.
 */
export function drawText(
  pixels: Uint8Array, width: number, height: number,
  x: number, y: number, text: string, color?: RGB, scale?: number,
): number

/** Measure the pixel width {@link drawText} would draw for `text`. */
export function measureText(text: string, scale?: number): number


/** 2D sketch renderer: SVG with dimensions, constraint badges and label de-overlap. */
export function renderSketchSVG(
  items: unknown[], width?: number, height?: number,
  dimensions?: unknown[], constraints?: unknown[], posMap?: Record<string, unknown>,
): string | null

/** 2D renderer for tessellated curve shapes (type-2 graphic containers). */
export function renderCurveSVG(graphic: { containers?: unknown[] }, width?: number, height?: number): string | null

/** Renderer for work geometry (planes, axes, points, csys triads). */
export function renderWorkGeoSVG(
  workGeo: ReturnType<typeof extractWorkGeometry>, width?: number, height?: number, extraPts2d?: number[][],
): string | null

/** Legacy SVG solid renderer (painter's algorithm). Prefer {@link renderSolidZBuffer}. */
export function renderSolidSVG(
  graphic: { containers?: unknown[] }, width?: number, height?: number,
  instances?: unknown[] | null, colorMode?: string,
): string | null

/** Dimension data for one sketch (linear/radial/diameter/angular), for {@link renderSketchSVG}. */
export function extractDimensions(tree: Record<string, unknown>, sketchId: number): unknown[]

/** User-created constraints for one sketch (auto-generated ones filtered out). */
export function extractConstraints(tree: Record<string, unknown>, sketchId: number): unknown[]

/** Work geometry definitions from the structure tree (built-ins excluded). */
export function extractWorkGeometry(tree: Record<string, unknown>): {
  planes: unknown[]; axes: unknown[]; points: unknown[]; csyses: unknown[]
}

// ─── STL path (@classcad/renderer/stl) ───────────────────────────────────────

/**
 * Parse a BINARY STL buffer into triangles for {@link renderIsometric}. Use
 * to render what an EXPORTED file actually contains — independent of the
 * graphic pipeline (export verification, graphics-disabled clients).
 */
export function parseSTL(buf: Uint8Array): Array<{ normal: Vec3; vertices: Vec3[] }>

/**
 * Legacy isometric triangle renderer (flat shading + wireframe overlay).
 * Returns an RGBA buffer; encode via the node or browser adapter. For
 * anything view/option-aware, convert the triangles to a graphic container
 * and use {@link renderSolidZBuffer} instead (the node adapter's
 * `source: 'stl'` does exactly that).
 */
export function renderIsometric(
  triangles: Array<{ normal: Vec3; vertices: Vec3[] }>,
  width: number, height: number,
): Uint8Array

// ─── Node adapter (@classcad/renderer/node — requires sharp) ─────────────────

/** One file written by {@link renderSession}. */
export interface RenderedFile {
  type: string
  file: string
  /** Present (as `'stl'`) when the render came from the explicit STL source. */
  source?: 'stl'
  sketchId?: number
  name?: string
}

/**
 * NODE ONLY. Render all visible content of a LIVE session to PNG files — the
 * drop-in harness renderer. Ensures the graphic database settings (so edges
 * are included), fetches tree + graphic from the client, delegates to
 * {@link renderSessionData}, and encodes/writes the files.
 *
 * FAILS LOUDLY: if the session contains solids/curves but no graphic data
 * arrived (e.g. the client connected with graphics disabled), it THROWS with
 * the cause and the remedies — it never silently returns an empty render.
 *
 * @param client - `{ execute, request, getLastGraphic? }` — a harness-style client
 * @param prefix - output file prefix (`<prefix>-solid.png`, `<prefix>-sheet.png`, …)
 * @param outDir - output directory
 * @param options - {@link RenderOptions} plus:
 *   - `recalc` — recalc before rendering for fresh graphic state.
 *     `common.recalc` DESTROYS entity-injection (direct-modeling) bodies —
 *     pass `false` for `solid.*`/EIF sessions. @defaultValue `true`
 *   - `ensureGraphics` — set the graphic database settings first (edges!).
 *     @defaultValue `true`
 *   - `source` — `'graphic'` (default) or `'stl'`: render the tessellated STL
 *     EXPORT through the same pipeline instead. Explicit opt-in fallback for
 *     graphics-disabled clients and independent export verification; never
 *     chosen automatically; marked `source: 'stl'` in the result; no brep edges.
 */
export function renderSession(
  client: { execute: Function; request: Function; getLastGraphic?: Function },
  prefix: string,
  outDir: string,
  options?: RenderOptions & { recalc?: boolean; ensureGraphics?: boolean; source?: 'graphic' | 'stl' },
): Promise<RenderedFile[]>

/**
 * NODE ONLY. Fetch the freshest graphic payload from a live client: recalc
 * first (unless `recalc: false` — see the EIF caveat on {@link renderSession}),
 * falling back to the client's accumulated last graphic.
 */
export function fetchGraphic(
  client: { execute: Function; getLastGraphic?: Function },
  opts?: { recalc?: boolean },
): Promise<unknown>

/** NODE ONLY. Encode an RGBA buffer as PNG bytes (sharp). */
export function pixelsToPng(pixels: Uint8Array, width: number, height: number): Promise<Uint8Array>

/** NODE ONLY. Save an RGBA buffer as a PNG file (sharp). */
export function savePNG(pixels: Uint8Array, width: number, height: number, path: string): Promise<void>

/** NODE ONLY. Rasterize an SVG string to PNG bytes (sharp). */
export function svgToPngBuffer(svg: string): Promise<Uint8Array>

/** NODE ONLY. Rasterize an SVG string to a PNG file (sharp). */
export function svgToPng(svg: string, pngPath: string): Promise<void>

// ─── Browser adapter (@classcad/renderer/browser — canvas encoding) ──────────

/** BROWSER ONLY. Encode an RGBA buffer as base64 PNG (no `data:` prefix) via canvas. */
export function pixelsToPngBase64(pixels: Uint8Array, width: number, height: number): Promise<string>

/** BROWSER ONLY. Rasterize an SVG string to base64 PNG via canvas. */
export function svgToPngBase64(svg: string, width?: number, height?: number): Promise<string>

/** BROWSER ONLY. Encode one {@link SessionEntry} (pixels or svg) as base64 PNG. */
export function entryToPngBase64(entry: SessionEntry): Promise<string>
