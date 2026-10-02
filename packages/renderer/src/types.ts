// Shared types for @classcad/renderer.

/** A 3D point or vector in world coordinates: `[x, y, z]`. */
export type Vec3 = [number, number, number]

/** An RGB color: `[r, g, b]`, each channel 0–255. */
export type RGB = [number, number, number]

/**
 * A view frame: projection scale plus the projected-space center. Every raster
 * render reports the frame it used; pass it back via {@link RenderOptions.frame}
 * to pin later renders of a CHANGED model to the same scale and center, making
 * before/after images pixel-comparable (see diffImages).
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
  /** Text still to draw over `pixels` ({@link RenderOptions.vectorText}); absent when text was rasterized. */
  labels?: TextLabel[]
}

/** A label for an adapter to draw with a real font, in output pixels. */
export interface TextLabel {
  /** Anchor x (left, center or right edge per `anchor`). */
  x: number
  /** Baseline y. */
  y: number
  /** Height of a capital letter in pixels. */
  capHeight: number
  text: string
  color: [number, number, number]
  anchor: 'start' | 'middle' | 'end'
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
 * Named views and vector cameras aimed the same way produce the same image
 * (`'right'` = `{ azimuth: 90 }`, `'left'` = `{ azimuth: -90 }`). Views are
 * never mirrored: first- vs third-angle projection only changes where a view
 * is placed on a drawing (see {@link RenderOptions.drawing}).
 */
export type CameraView =
  | 'iso' | 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right'
  | { azimuth?: number; elevation?: number }
  | { direction: Vec3; up?: Vec3 }

/**
 * A cutting plane for section views. Everything on the POSITIVE side of the
 * normal is removed. The cut faces are capped — filled and hatched at 45° like
 * a drawing's section — unless `cap: false`. Framing stays that of the UNCUT model, so sectioned and
 * unsectioned renders of the same state are directly comparable.
 */
export interface SectionPlane {
  /** A point on the plane, world coordinates. */
  origin: Vec3
  /** Plane normal; the positive half-space is cut away. Need not be unit length. */
  normal: Vec3
  /**
   * Cap the cut: the cut faces are filled and hatched at 45° like a drawing's
   * section (adjacent bodies alternate the direction), outlined as edges.
   * `false` leaves the cut open — interior walls visible, shaded darker.
   * @defaultValue `true`
   */
  cap?: boolean
}

/**
 * A probe marker: crosshair + optional label at a world position, drawn on top
 * of everything (no depth test).
 */
export interface Marker {
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

// ── Graphic payload (AWV graphic protocol; loose structural typing) ──────────

export interface GraphicMesh {
  id?: number
  material?: { color?: number[] } | null
  vertices: number[]
  normals: number[]
  indices: number[]
  [key: string]: unknown
}

export interface GraphicEdge {
  id?: number
  points: number[]
  [key: string]: unknown
}

export interface GraphicContainer {
  id?: number
  owner?: number
  type?: number
  properties?: { material?: { color?: number[] } | null; [key: string]: unknown }
  meshes?: GraphicMesh[]
  edges?: GraphicEdge[]
  /**
   * Not part of the engine payload — a hint for the rasterizer: an open body
   * (a sheet). Both of its sides are drawn, and a section does not cap it: in
   * place of the cap it draws the line of the cut.
   * renderSessionData sets it on the containers of `CC_Sheet` bodies.
   */
  open?: boolean
  [key: string]: unknown
}

export interface Graphic {
  containers?: GraphicContainer[]
  [key: string]: unknown
}

/** A structure-tree node (loose — the tree is engine-defined). */
export type TreeNode = Record<string, any>
export type Tree = Record<string, TreeNode>

/** An assembly instance draw entry (from extractAssemblyInstances). */
export interface AssemblyInstance {
  /** Tree id of the body drawn, a solid or a sheet body — the `owner` of its graphic container. */
  ownerSolidId: number
  partId: number
  transform: number[]
}

/**
 * Options accepted by renderSessionData / renderSolidZBuffer and (with
 * additions) the node adapter's renderSession. All features compose freely.
 */
export interface RenderOptions {
  /** Image width in pixels. @defaultValue `1600` */
  width?: number
  /**
   * Anti-aliasing for raster (solid/sheet) renders: draw at k× resolution and
   * box-filter down to width×height — same output size, smooth edges and text.
   * 1–4. @defaultValue `1`
   */
  supersample?: number
  /**
   * Draw labels (sheet titles, markers, annotate overlay) with a real font at
   * output resolution instead of the built-in 5×7 bitmap font. Raster entries
   * then carry `labels`; the Node adapter composites them (sharp/SVG).
   * @defaultValue `false`
   */
  vectorText?: boolean
  /** Image height in pixels. @defaultValue `1200` */
  height?: number
  /** Camera: named view or arbitrary orthographic camera. @defaultValue `'iso'` */
  view?: CameraView
  /** Multiplier on the auto-fit scale (>1 zooms in). Ignored when `frame` is set. @defaultValue `1` */
  zoom?: number
  /** World point that lands at the image center. Ignored when `frame` is set. */
  lookAt?: Vec3
  /**
   * Pin the view frame of an earlier render (same view + image size): fixes
   * scale AND center so renders of different model states stay
   * pixel-comparable — the precondition for diffImages. Overrides auto-fit,
   * `zoom` and `lookAt`.
   */
  frame?: Frame
  /**
   * `'native'` renders the model's own ClassCAD colors (face-mesh material
   * first, then container material; bodies without material fall back to the
   * palette). `'distinct'` gives every body its own palette color — use it to
   * tell bodies apart in booleans, splits, patterns. @defaultValue `'native'`
   */
  colors?: 'native' | 'distinct'
  /** Cut the solids at a plane — see {@link SectionPlane}. */
  section?: SectionPlane
  /**
   * Ids rendered in signal orange (faces/bodies) or signal red (edges).
   * Matches graphic container ids, owning solid ids (`container.owner`), face
   * mesh ids and edge ids. CAUTION: face/edge ids are only stable within ONE
   * graphic payload — across recalcs use `highlightAt`.
   */
  highlight?: number[]
  /**
   * World points; the closest face in the RENDERED payload is highlighted per
   * point. Geometrically anchored — robust where raw ids are not.
   */
  highlightAt?: Vec3[]
  /** Probe markers drawn on top of the render — see {@link Marker}. */
  markers?: Marker[]
  /**
   * Draw every sketch's curves in 3D — world coordinates, on the sketch's
   * actual plane — on top of the solid render. Construction geometry dashes
   * violet. Needs `execute`; renders standalone without solid geometry.
   * @defaultValue `false`
   */
  sketchOverlay?: boolean
  /**
   * Measurement overlay: world bounding-box extents, an RGB axes triad
   * oriented like the current view, and a scale bar. @defaultValue `false`
   */
  annotate?: boolean
  /**
   * Translucent bodies (painter's blend, far-to-near): hidden bodies and
   * internal far walls shine through; edges stay opaque. @defaultValue `false`
   */
  xray?: boolean
  /** Blend alpha for `xray` (0–1 exclusive). @defaultValue `0.42` */
  xrayAlpha?: number
  /**
   * Render the solids as a FOUR-VIEW SHEET (quadrants TL/TR/BL/BR; `true` =
   * top/iso/front/right; ortho views share one scale). Entry type becomes
   * `'sheet'`. @defaultValue `false`
   */
  sheet?: boolean | CameraView[]
  /**
   * Line style (hidden-line drawing) instead of shading: visible edges and
   * silhouettes solid, hidden edges and silhouettes dashed, no fill. Applies to
   * the single-view solid render and to every panel of a `sheet`. Hidden lines
   * carry the internal structure (bores, pockets, hollow vs solid) that a
   * shaded view cannot show. @defaultValue `false`
   */
  lines?: boolean
  /**
   * Render the solids as a TECHNICAL DRAWING: front, top and side view in
   * line style, laid out by projection method, aligned and at one shared
   * scale, plus a shaded iso in the free quadrant. Entry type becomes
   * `'drawing'`. Takes precedence over `sheet`.
   * - `'first-angle'` (ISO method E, Europe): top view BELOW the front view,
   *   the view from the left RIGHT of it.
   * - `'third-angle'` (ISO method A, ASME/US): top view ABOVE the front view,
   *   the view from the right RIGHT of it.
   * `true` = `'first-angle'`. The object form picks the side view explicitly;
   * its placement follows the projection method. @defaultValue `false`
   */
  drawing?: boolean | ProjectionMethod | DrawingOptions
  /** Content types to render (default: all detected). Skipped layers cost nothing. */
  layers?: Array<'solid' | 'sketch' | 'curves' | 'workgeo'>
}

/** Orthographic projection method of a technical drawing (ISO 5456-2). */
export type ProjectionMethod = 'first-angle' | 'third-angle'

/** Options of {@link RenderOptions.drawing}. */
export interface DrawingOptions {
  /** @defaultValue `'first-angle'` */
  projection?: ProjectionMethod
  /**
   * Which side view to show: seen from the left (camera at −X) or from the
   * right (camera at +X). @defaultValue `'left'` for first-angle, `'right'`
   * for third-angle — both end up to the right of the front view.
   */
  side?: 'left' | 'right'
  /** Shaded iso view in the free quadrant. @defaultValue `true` */
  iso?: boolean
}

/** Internal per-render options of the z-buffer rasterizer (superset of RenderOptions extras). */
export interface SolidRenderOptions extends RenderOptions {
  overlays?: OverlayPolyline[]
}

/** The data a render needs — all injectable, which is what makes the core portable. */
export interface SessionSource {
  /** Structure tree (`GetTree` → `structure.tree`). */
  tree: Tree
  /** Graphic payload with `containers`. Required for solid/curve renders. */
  graphic?: Graphic | null
  /** Harness-task executor: `execute({ 'v1.sketch.getGeometry': [{ id }] })`. Enables sketch renders. */
  execute?: (task: Record<string, unknown[]>) => Promise<{ result?: any }>
}

/** One rendered artifact from renderSessionData. */
export type SessionEntry =
  | ({ type: 'solid' | 'sheet' | 'drawing'; kind: 'pixels' } & RasterResult)
  | { type: 'sketch'; kind: 'svg'; svg: string; sketchId: number; name: string }
  | { type: 'curves' | 'workgeo'; kind: 'svg'; svg: string }

/** Result of diffImages. */
export interface DiffResult {
  changed: number
  total: number
  fraction: number
  bbox: { minX: number; minY: number; maxX: number; maxY: number } | null
  pixels: Uint8Array
  width: number
  height: number
}
