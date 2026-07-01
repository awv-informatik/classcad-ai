// Shared setup + assertion helpers for the splitCurve training scripts.
// Imported by each NN-*.mjs script. Not run directly by the harness.

/** Create a part + a solver-enabled sketch on the named work plane (default 'Top'). */
export async function makeSketch(api, { name = 'SplitCurve', plane = 'Top' } = {}) {
  const partR = await api.v1.part.create({ name })
  const partId = partR.result
  const wp = Object.values(partR.structure.tree).find(n => n.class === 'CC_WorkPlane' && n.name === plane)
  if (!wp) throw new Error(`work plane '${plane}' not found`)
  const skId = (await api.v1.sketch.create({ id: partId, planeId: wp.id, name: 'S' })).result
  return { partId, skId, planeId: wp.id }
}

// NOTE (verified 05c/05d): `part.create` works only ONCE per harness run — the 2nd+ call
// returns VOID (result:null) and poisons the drawing. So call makeSketch ONCE per run, then
// use addSketch / addPlanelessSketch / line to build additional geometry on the SAME part.

/** Add another sketch on an existing part (no extra part.create). */
export async function addSketch(api, partId, planeId, name) {
  return (await api.v1.sketch.create({ id: partId, planeId, name })).result
}

/** Add a PLANELESS sketch (dead constraint solver) on an existing part — for solver-independence tests. */
export async function addPlanelessSketch(api, partId, name = 'planeless') {
  return (await api.v1.sketch.create({ id: partId, name })).result // no planeId
}

export async function line(api, skId, a, b) {
  return (await api.v1.sketch.line({ id: skId, startPos: a, endPos: b })).result
}

export async function circle(api, skId, center, radius) {
  return (await api.v1.sketch.circle({ id: skId, centerPos: center, radius })).result
}

/** Draw an obround (stadium): two end circles at a,b (2D) radius r + the two tangent side lines.
 *  Returns { circles:[idA,idB], lines:[id1,id2] }. a,b are [x,y]. */
export async function obround(api, skId, a, b, r) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1
  const nx = -dy / L * r, ny = dx / L * r            // perpendicular offset by r
  const cA = await circle(api, skId, [a[0], a[1], 0], r)
  const cB = await circle(api, skId, [b[0], b[1], 0], r)
  const l1 = await line(api, skId, [a[0] + nx, a[1] + ny, 0], [b[0] + nx, b[1] + ny, 0])
  const l2 = await line(api, skId, [a[0] - nx, a[1] - ny, 0], [b[0] - nx, b[1] - ny, 0])
  return { circles: [cA, cB], lines: [l1, l2] }
}

/** CC_Container staging nodes (SplittedCurves / NoneSplitted) found by NAME (ids vary run-to-run). */
export function containers(tree) {
  return Object.values(tree || {})
    .filter(n => n.class === 'CC_Container')
    .map(n => ({ id: n.id, name: n.name, childCount: n.children?.length ?? 0, parent: n.parent }))
}

export function nodeById(tree, id) {
  return tree?.[id] || Object.values(tree || {}).find(n => n.id === id)
}

/** Circle center coord via getPoints->centerId->getPositions (getPositions fails on the circle id itself). */
export async function centerPos(api, circleId) {
  const pts = (await api.v1.sketch.getPoints({ id: circleId })).result
  if (!pts?.centerId) return { centerId: null, pos: null }
  const p = await positions(api, pts.centerId)
  return { centerId: pts.centerId, pos: p.pos }
}

/** getPositions normalized to plain arrays. Returns { startPos, endPos } or { pos } as [x,y,z]. */
export async function positions(api, id) {
  const r = await api.v1.sketch.getPositions({ id })
  const v = o => (o ? [o.x, o.y, o.z] : null)
  return {
    maxLevel: r.maxLevel,
    startPos: r.result?.startPos ? v(r.result.startPos) : undefined,
    endPos: r.result?.endPos ? v(r.result.endPos) : undefined,
    pos: r.result?.pos ? v(r.result.pos) : undefined,
    raw: r.result,
  }
}

/** Post-trim cleanup: delete sliver curves (chord length < minLen) and orphan points (center-marks left by
 *  trimmed circles — points not referenced by any surviving line/arc). Returns { delSlivers, delPoints }. */
export async function cleanupSlivers(api, skId, { minLen = 0.05 } = {}) {
  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  const slivers = []
  const used = new Set()
  // sliver test applies to LINES only — a near-full arc has a tiny chord but is a big curve (don't delete it).
  for (const id of geo.lines) {
    const p = await positions(api, id)
    const len = Math.hypot(p.endPos[0] - p.startPos[0], p.endPos[1] - p.startPos[1])
    if (len < minLen) { slivers.push(id); continue }
    const pts = (await api.v1.sketch.getPoints({ id })).result
    if (pts?.startId) used.add(pts.startId)
    if (pts?.endId) used.add(pts.endId)
  }
  for (const id of geo.arcs || []) {
    const pts = (await api.v1.sketch.getPoints({ id })).result
    if (pts?.startId) used.add(pts.startId)
    if (pts?.endId) used.add(pts.endId)
  }
  const orphanPts = (geo.points || []).filter(pid => !used.has(pid))
  const toDelete = [...slivers, ...orphanPts]
  if (toDelete.length) await api.v1.sketch.deleteObject({ ids: toDelete })
  return { delSlivers: slivers.length, delPoints: orphanPts.length }
}

export const approx = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps
export const vecApprox = (p, q, eps = 1e-6) =>
  Array.isArray(p) && Array.isArray(q) && p.length === q.length && p.every((x, i) => approx(x, q[i], eps))

/** Compact one-line summary of a splitCurve response for logging. */
export function summarizeSplit(r) {
  const arr = Array.isArray(r.result) ? r.result : null
  return {
    maxLevel: r.maxLevel,
    nMessages: r.messages?.length ?? 0,
    resultIsArray: Array.isArray(r.result),
    nEntries: arr?.length,
    perEntry: arr?.map(e => ({
      sourceId: e.sourceId,
      segs: e.splittedCurves?.length,
      intervals: e.splittedCurves?.map(s => s.interval),
      keys: e ? Object.keys(e).sort() : null,
      segKeys: e.splittedCurves?.[0] ? Object.keys(e.splittedCurves[0]).sort() : null,
    })),
  }
}

/** First-error message extraction for error-case probes. */
export function firstError(r) {
  return (r.messages || []).map(m => ({ level: m.level, code: m.code, message: m.message }))
}
