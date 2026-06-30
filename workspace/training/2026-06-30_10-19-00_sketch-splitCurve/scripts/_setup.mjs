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
