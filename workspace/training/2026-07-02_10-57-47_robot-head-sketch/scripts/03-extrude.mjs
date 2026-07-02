// 03 — Closed-region proof, v2 (full eye circles). Two findings expected:
//   (a) extruding the drawing-faithful sketch directly (full Ø5.6 circles tangent to dome/
//       fillets) — does the region resolver cope with tangent-contact boundaries?
//   (b) the profile route: preTrim splits each doubly-tangent eye circle into 2 arcs at its
//       tangent points → trim the INNER arc (apex-nearer-origin, from the bulge apex formula),
//       keep the rim → extrude → volume vs analytic area.
import { buildRobotHead } from './_build.mjs'
import { model, EXACT, loopArea, AREA_OUTER_KEYS, SLOT_KEYS, PROFILE_KEYS } from './_model.mjs'

export default async function (api, { snapshot, filewrite }) {
  const b = await buildRobotHead(api)
  const msgs = r => (r?.messages || []).map(m => ({ level: m.level, code: m.code, message: m.message?.slice(0, 160) }))

  // (a) direct attempt with the full circles
  const refs = PROFILE_KEYS.map(k => b.id[k])
  const r1 = await api.v1.part.extrusion({ id: b.partId, references: refs, limit2: 2 })
  console.log('[03a] direct extrusion (full circles): result', r1.result, 'maxLevel', r1.maxLevel, JSON.stringify(msgs(r1)))
  if (r1.result != null && r1.maxLevel >= 51) {
    const del = await api.v1.part.deleteFeature({ ids: [r1.result] })
    console.log('[03a] deleted broken feature, maxLevel', del.maxLevel)
  }

  // (b) trim the eye circles to their rims, then extrude. Each eye splits into 4 arcs:
  // 2 tangent points (dome, f2) + 2 crossings of the CLH construction centerline. All four
  // are minor arcs, so each apex = eyeCenter + R·unit(chordMid − eyeCenter) (no bulge math).
  // The 2 rim arcs (apex farthest from origin) stay and coalesce at (±8.8, 0); trim the rest.
  const pre = await api.v1.sketch.preTrim({ id: b.skId })
  const toTrim = []
  for (const eye of ['bossR', 'bossL']) {
    const entry = (pre.result || []).find(e => e.sourceId === b.id[eye])
    if (!entry) { console.log(`[03b] ${eye}: NOT split — unexpected`); continue }
    const eyeC = eye === 'bossR' ? [6, 0] : [-6, 0]
    const segs = []
    for (const sc of entry.splittedCurves) {
      const p = (await api.v1.sketch.getPositions({ id: sc.id })).result
      const s = [p.startPos.x, p.startPos.y], e = [p.endPos.x, p.endPos.y]
      const mid = [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2]
      const v = [mid[0] - eyeC[0], mid[1] - eyeC[1]], L = Math.hypot(v[0], v[1]) || 1
      const apex = [eyeC[0] + (v[0] / L) * 2.8, eyeC[1] + (v[1] / L) * 2.8]
      segs.push({ id: sc.id, apex, rFromOrigin: Math.hypot(apex[0], apex[1]) })
    }
    segs.sort((a, z) => a.rFromOrigin - z.rFromOrigin)
    const inner = segs.slice(0, segs.length - 2) // keep the 2 outermost (the rim)
    toTrim.push(...inner.map(x => x.id))
    console.log(`[03b] ${eye}: ${segs.length} segs — trim ${inner.length} inner`, JSON.stringify(segs.map(x => ({ id: x.id, apex: x.apex.map(vv => +vv.toFixed(3)), r: +x.rFromOrigin.toFixed(3) }))))
  }
  await api.v1.sketch.trim({ id: b.skId, curveIds: toTrim })
  const post = await api.v1.sketch.postTrim({ id: b.skId })
  console.log('[03b] trim+postTrim maxLevel:', post.maxLevel)

  // collect surviving profile curves (untrimmed keep ids; the rims are NEW arc ids)
  const geo = (await api.v1.sketch.getGeometry({ id: b.skId })).result
  const construction = [b.id.clh, b.id.clv]
  const refs2 = [...(geo.lines || []), ...(geo.arcs || []), ...(geo.circles || [])].filter(i => !construction.includes(i))
  const r2 = await api.v1.part.extrusion({ id: b.partId, references: refs2, limit2: 2 })
  console.log('[03b] extrusion (trimmed rims): result', r2.result, 'maxLevel', r2.maxLevel, JSON.stringify(msgs(r2)))
  await snapshot('03-solid')
  await snapshot('03-top', { view: 'top' })

  const M = model(EXACT)
  const area = loopArea(M, AREA_OUTER_KEYS) - loopArea(M, SLOT_KEYS) - 2 * Math.PI * EXACT.RH ** 2
  const analyticVolume = area * 2
  const mp = (await api.v1.part.calculateMassProperties({ id: b.partId })).result
  const volume = mp?.volume ?? mp?.[0]?.volume
  const delta = volume != null ? Math.abs(volume - analyticVolume) / analyticVolume : null
  filewrite({ direct: { result: r1.result, maxLevel: r1.maxLevel, messages: msgs(r1) }, trimmed: { result: r2.result, maxLevel: r2.maxLevel, refs: refs2.length }, analyticArea: area, analyticVolume, volume, relDelta: delta }, 'volume')
  console.log('[03] analytic volume:', analyticVolume, '| measured:', volume, '| relΔ:', delta)
  return { directOk: r1.maxLevel <= 31, trimmedOk: r2.result != null && r2.maxLevel <= 31, volume, analyticVolume, relDelta: delta }
}
