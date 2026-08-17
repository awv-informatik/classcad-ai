// Lever bracket 02 — outer contour: layout (verified 14/14 in 01) + boundary-classifier trim
// + mergeBack + Green's-theorem area from the solved loop + extrude t=0.5.
// Helper radials hl1/hl2 are EXCLUDED from trimming so the 40° conditioning survives.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LeverBracket' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const sk = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'Outer' })).result
  const ctr = async id => (await api.v1.sketch.getPoints({ id })).result.centerId
  const pos = async id => (await api.v1.sketch.getPositions({ id })).result

  // ---------- geometry (rough seeds; only the datum is exact) ----------
  const mainO = (await api.v1.sketch.circle({ id: sk, centerPos: [0, 0, 0], radius: 0.8 })).result
  const topO = (await api.v1.sketch.circle({ id: sk, centerPos: [-0.7, 1.8, 0], radius: 0.7 })).result
  const lCap = (await api.v1.sketch.circle({ id: sk, centerPos: [-1.8, 0.1, 0], radius: 0.6 })).result
  const rCap = (await api.v1.sketch.circle({ id: sk, centerPos: [-0.8, -0.1, 0], radius: 0.6 })).result
  const lowCap = (await api.v1.sketch.circle({ id: sk, centerPos: [2.2, 0.1, 0], radius: 0.8 })).result
  const upCap = (await api.v1.sketch.circle({ id: sk, centerPos: [1.7, 1.5, 0], radius: 0.8 })).result
  const lobeO = (await api.v1.sketch.circle({ id: sk, centerPos: [0.1, 0.1, 0], radius: 3.0 })).result
  // transition fillets (seeded near the intended pockets, radii deliberately off)
  const f1750 = (await api.v1.sketch.circle({ id: sk, centerPos: [-3.2, 2.0, 0], radius: 1.6 })).result
  const f625a = (await api.v1.sketch.circle({ id: sk, centerPos: [0.6, 2.4, 0], radius: 0.55 })).result
  const f625b = (await api.v1.sketch.circle({ id: sk, centerPos: [0.3, 1.5, 0], radius: 0.55 })).result
  const f1375 = (await api.v1.sketch.circle({ id: sk, centerPos: [1.2, -1.9, 0], radius: 1.3 })).result
  // web lines (free; tangency will place them)
  const botLine = (await api.v1.sketch.line({ id: sk, startPos: [-1.9, -0.8, 0], endPos: [-0.7, -0.85, 0] })).result
  const webLine = (await api.v1.sketch.line({ id: sk, startPos: [-0.6, -0.9, 0], endPos: [0.2, -1.0, 0] })).result
  // helper radials for the 40° scheme
  const C = {}
  for (const [k, id] of Object.entries({ mainO, topO, lCap, rCap, lowCap, upCap, lobeO, f1750, f625a, f625b, f1375 }))
    C[k] = await ctr(id)
  const hl1 = (await api.v1.sketch.line({ id: sk, startPos: [0, 0, 0], endPos: [2.4, 0, 0] })).result
  const hl2 = (await api.v1.sketch.line({ id: sk, startPos: [0, 0, 0], endPos: [1.7, 1.5, 0] })).result
  const hp1 = (await api.v1.sketch.getPoints({ id: hl1 })).result
  const hp2 = (await api.v1.sketch.getPoints({ id: hl2 })).result

  // ---------- constraints ----------
  const rel = await api.v1.sketch.constraint([
    { id: sk, type: 'FIXATION', geomIds: [C.mainO] },                       // datum: main center (0,0)
    { id: sk, type: 'CONCENTRIC', geomIds: [lobeO, mainO] },
    // helper radial wiring
    { id: sk, type: 'COINCIDENT', geomIds: [hp1.startId, C.mainO] },
    { id: sk, type: 'COINCIDENT', geomIds: [hp1.endId, C.lowCap] },
    { id: sk, type: 'COINCIDENT', geomIds: [hp2.startId, C.mainO] },
    { id: sk, type: 'COINCIDENT', geomIds: [hp2.endId, C.upCap] },
    // lobe outer envelope + transition tangencies
    { id: sk, type: 'TANGENT', geomIds: [lobeO, lowCap] },
    { id: sk, type: 'TANGENT', geomIds: [lobeO, upCap] },
    { id: sk, type: 'TANGENT', geomIds: [f1750, lCap] },
    { id: sk, type: 'TANGENT', geomIds: [f1750, topO] },
    { id: sk, type: 'TANGENT', geomIds: [f625a, topO] },
    { id: sk, type: 'TANGENT', geomIds: [f625a, upCap] },
    { id: sk, type: 'TANGENT', geomIds: [f625b, mainO] },
    { id: sk, type: 'TANGENT', geomIds: [f625b, upCap] },
    { id: sk, type: 'TANGENT', geomIds: [f1375, mainO] },
    { id: sk, type: 'TANGENT', geomIds: [f1375, lowCap] },
    // web lines
    { id: sk, type: 'TANGENT', geomIds: [botLine, lCap] },
    { id: sk, type: 'TANGENT', geomIds: [botLine, rCap] },
    { id: sk, type: 'TANGENT', geomIds: [webLine, rCap] },
    { id: sk, type: 'TANGENT', geomIds: [webLine, mainO] },
  ])
  console.log('[01] relations maxLevel:', rel.maxLevel)

  const dims = await api.v1.sketch.dimension([
    { id: sk, name: 'Dmain', type: 'DIAMETER', geomIds: [mainO], value: 1.750 },
    { id: sk, name: 'Dtop', type: 'DIAMETER', geomIds: [topO], value: 1.625 },
    { id: sk, name: 'DlCap', type: 'DIAMETER', geomIds: [lCap], value: 1.500 },
    { id: sk, name: 'DrCap', type: 'DIAMETER', geomIds: [rCap], value: 1.500 },
    { id: sk, name: 'DlowCap', type: 'DIAMETER', geomIds: [lowCap], value: 1.750 },
    { id: sk, name: 'DupCap', type: 'DIAMETER', geomIds: [upCap], value: 1.750 },
    { id: sk, name: 'Rf1750', type: 'RADIUS', geomIds: [f1750], value: 1.750 },
    { id: sk, name: 'Rf625a', type: 'RADIUS', geomIds: [f625a], value: 0.625 },
    { id: sk, name: 'Rf625b', type: 'RADIUS', geomIds: [f625b], value: 0.625 },
    { id: sk, name: 'Rf1375', type: 'RADIUS', geomIds: [f1375], value: 1.375 },
    { id: sk, name: 'HDtop', type: 'HORIZONTAL_DISTANCE', geomIds: [C.topO, C.mainO], value: 0.750 },
    { id: sk, name: 'VDtop', type: 'VERTICAL_DISTANCE', geomIds: [C.topO, C.mainO], value: 1.875 },
    { id: sk, name: 'HDlCap', type: 'HORIZONTAL_DISTANCE', geomIds: [C.lCap, C.mainO], value: 1.867 }, // stands in for 5.804
    { id: sk, name: 'VDlCap', type: 'VERTICAL_DISTANCE', geomIds: [C.lCap, C.mainO], value: 0 },
    { id: sk, name: 'HDcaps', type: 'HORIZONTAL_DISTANCE', geomIds: [C.lCap, C.rCap], value: 1.000 },
    { id: sk, name: 'VDcaps', type: 'VERTICAL_DISTANCE', geomIds: [C.lCap, C.rCap], value: 0 },
    { id: sk, name: 'HDlow', type: 'HORIZONTAL_DISTANCE', geomIds: [C.mainO, C.lowCap], value: 2.312 },
    { id: sk, name: 'VDlow', type: 'VERTICAL_DISTANCE', geomIds: [C.mainO, C.lowCap], value: 0 },
    { id: sk, name: 'LenHl2', type: 'OFFSET', geomIds: [hl2], value: 2.312 },
    { id: sk, name: 'Ang40', type: 'ANGLE', geomIds: [hl1, hl2], value: '40deg', dimPos: [1.8, 0.7, 0] },
  ])
  console.log('[01] dims maxLevel:', dims.maxLevel)

  // ---------- solved values needed by the classifier ----------
  const got = {}
  for (const k of ['topO', 'lCap', 'rCap', 'lowCap', 'upCap', 'f1750', 'f625a', 'f625b', 'f1375']) {
    const p = (await pos(C[k])).pos
    got[k] = [p.x, p.y]
  }
  const treeG = Object.values((await api.v1.sketch.getGeometry({ id: sk })).structure?.tree ?? {})
  const lobeR = treeG.find(n => n?.id === lobeO)?.members?.radius?.value
  console.log('[02] lobeR:', lobeR)

  // ---------- insideFinal (solved data) ----------
  const R = { topO: 0.8125, lCap: 0.75, rCap: 0.75, lowCap: 0.875, upCap: 0.875, mainO: 0.875 }
  got.mainO = [0, 0]
  const FIL = [
    ['f1750', 1.75, 'lCap', 'topO'], ['f625a', 0.625, 'topO', 'upCap'],
    ['f625b', 0.625, 'mainO', 'upCap'], ['f1375', 1.375, 'mainO', 'lowCap'],
  ]
  const inDisc = (p, k) => Math.hypot(p[0] - got[k][0], p[1] - got[k][1]) <= R[k]
  const inHull = (p, a, b) => {
    const A = got[a], B = got[b], ra = R[a], rb = R[b]
    const dx = B[0] - A[0], dy = B[1] - A[1], L2 = dx * dx + dy * dy
    let t = ((p[0] - A[0]) * dx + (p[1] - A[1]) * dy) / L2
    t = Math.max(0, Math.min(1, t))
    const qx = A[0] + t * dx, qy = A[1] + t * dy
    return Math.hypot(p[0] - qx, p[1] - qy) <= ra + (rb - ra) * t
  }
  const norm2pi = a => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  const inSector = p => {
    const r = Math.hypot(p[0], p[1]); if (r > lobeR) return false
    const th = Math.atan2(p[1], p[0])
    return th >= -1e-9 && th <= 40 * Math.PI / 180 + 1e-9
  }
  const inShell = (p, fk, rf, ak, bk) => {
    const F = got[fk]
    const d = Math.hypot(p[0] - F[0], p[1] - F[1])
    if (d < rf - 1e-9 || d > rf + 0.05) return false
    const aA = Math.atan2(got[ak][1] - F[1], got[ak][0] - F[0])
    const aB = Math.atan2(got[bk][1] - F[1], got[bk][0] - F[0])
    const span = norm2pi(aB - aA)
    const ap = norm2pi(Math.atan2(p[1] - F[1], p[0] - F[0]) - aA)
    return span <= Math.PI ? ap <= span : ap >= span // short-way containment
  }
  const insideFinal = (x, y) => {
    const p = [x, y]
    for (const k of Object.keys(R)) if (inDisc(p, k)) return true
    if (inHull(p, 'lCap', 'rCap') || inHull(p, 'rCap', 'mainO') || inHull(p, 'topO', 'mainO')) return true
    if (inSector(p)) return true
    for (const [fk, rf, ak, bk] of FIL) if (inShell(p, fk, rf, ak, bk)) return true
    return false
  }

  // ---------- split + classify (boundary test) ----------
  const sp = await api.v1.sketch.splitAllCurves({ id: sk })
  const tree = {}
  for (const n of Object.values(sp.structure?.tree ?? {})) if (n?.id != null) tree[n.id] = n
  console.log('[02] segments:', sp.result?.length)
  const helperIds = [hl1, hl2]
  const toTrim = []
  for (const sid of sp.result ?? []) {
    const n = tree[sid]
    const orig = n?.members?.partOf?.value ?? sid
    if (helperIds.includes(orig) || helperIds.includes(sid)) continue // keep helpers (conditioning)
    const q = (await api.v1.sketch.getPositions({ id: sid })).result
    let mids = [] // [point, outwardUnit]
    if (q?.centerPos) {
      const [t0, t1raw] = (n.members.interval?.members ?? []).map(m => m.value)
      const w = ((t1raw < t0 ? t1raw + 1 : t1raw) - t0)
      const th = pt => Math.atan2(pt.y - q.centerPos.y, pt.x - q.centerPos.x)
      const ts = th(q.startPos), te = th(q.endPos)
      const dCCW = norm2pi(te - ts)
      const dir = Math.abs(dCCW / (2 * Math.PI) - w) <= Math.abs((2 * Math.PI - dCCW) / (2 * Math.PI) - w) ? 1 : -1
      const mid = dir === 1 ? ts + dCCW / 2 : ts - (2 * Math.PI - dCCW) / 2
      const rr = n.members.radius.value
      mids = [[[q.centerPos.x + rr * Math.cos(mid), q.centerPos.y + rr * Math.sin(mid)], [Math.cos(mid), Math.sin(mid)]]]
    } else if (q?.startPos) {
      const mx = (q.startPos.x + q.endPos.x) / 2, my = (q.startPos.y + q.endPos.y) / 2
      const dx = q.endPos.x - q.startPos.x, dy = q.endPos.y - q.startPos.y, L = Math.hypot(dx, dy)
      mids = [[[mx, my], [-dy / L, dx / L]]]
    } else continue
    const [[m, u]] = mids
    const inA = insideFinal(m[0] - 0.01 * u[0], m[1] - 0.01 * u[1])
    const inB = insideFinal(m[0] + 0.01 * u[0], m[1] + 0.01 * u[1])
    const keep = inA !== inB
    if (!keep) toTrim.push(sid)
  }
  console.log('[02] trimming', toTrim.length, 'of', sp.result?.length)
  await api.v1.sketch.trimCurves({ id: sk, curveIds: toTrim })
  const mb = await api.v1.sketch.splitCurvesMergeBack({ id: sk })
  console.log('[02] mergeBack maxLevel:', mb.maxLevel)
  await snapshot('02-trimmed')

  // ---------- Green's-theorem area from the solved loop ----------
  const geom = (await api.v1.sketch.getGeometry({ id: sk })).result
  const treeM = Object.values((await api.v1.sketch.getGeometry({ id: sk })).structure?.tree ?? {})
  const boundary = [...(geom.arcs ?? []), ...(geom.lines ?? [])].filter(id => !helperIds.includes(id))
  console.log('[02] boundary curves:', boundary.length, '(expect 12: 10 arcs + 2 lines) — arcs:', (geom.arcs ?? []).length, 'lines:', (geom.lines ?? []).length)
  const elems = []
  for (const id of boundary) {
    const q = (await api.v1.sketch.getPositions({ id })).result
    const node = treeM.find(n => n?.id === id)
    elems.push({ id, q, node })
  }
  // chain the loop
  const eps = 1e-6
  const same = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < eps
  let chain = [elems[0]], used = new Set([elems[0].id])
  let cursor = elems[0].q.endPos
  let flip0 = false
  while (chain.length < elems.length) {
    const nxt = elems.find(e => !used.has(e.id) && (same(e.q.startPos, cursor) || same(e.q.endPos, cursor)))
    if (!nxt) { console.log('[02] ❌ loop chain broke at', JSON.stringify(cursor), '— chained', chain.length); break }
    nxt.rev = same(nxt.q.endPos, cursor)
    cursor = nxt.rev ? nxt.q.startPos : nxt.q.endPos
    chain.push(nxt); used.add(nxt.id)
  }
  const closed = same(cursor, chain[0].q.startPos)
  console.log('[02] loop chained:', chain.length, '/', boundary.length, 'closed:', closed)
  let A2 = 0 // 2*area accumulator
  for (const e of chain) {
    const P1 = e.rev ? e.q.endPos : e.q.startPos
    const P2 = e.rev ? e.q.startPos : e.q.endPos
    if (!e.q.centerPos) { A2 += P1.x * P2.y - P2.x * P1.y; continue }
    const Cc = e.q.centerPos
    const rr = e.node?.members?.radius?.value ?? Math.hypot(P1.x - Cc.x, P1.y - Cc.y)
    const iv = (e.node?.members?.interval?.members ?? []).map(m => m.value)
    let w = iv.length === 2 ? ((iv[1] < iv[0] ? iv[1] + 1 : iv[1]) - iv[0]) : null
    const th1 = Math.atan2(P1.y - Cc.y, P1.x - Cc.x), th2 = Math.atan2(P2.y - Cc.y, P2.x - Cc.x)
    const dCCW = norm2pi(th2 - th1)
    let delta
    if (w != null) delta = Math.abs(dCCW / (2 * Math.PI) - w) <= Math.abs((2 * Math.PI - dCCW) / (2 * Math.PI) - w) ? dCCW : -(2 * Math.PI - dCCW)
    else delta = dCCW <= Math.PI ? dCCW : dCCW - 2 * Math.PI
    A2 += Cc.x * (P2.y - P1.y) - Cc.y * (P2.x - P1.x) + rr * rr * delta
  }
  const area = Math.abs(A2) / 2
  console.log('[02] Green area of outer loop:', area.toFixed(6))

  // ---------- extrude t=0.5 and cross-check ----------
  const ext = await api.v1.part.extrusion({ id: partId, name: 'Plate', references: boundary, type: 'UP', limit2: 0.5 })
  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  console.log('[02] extrusion maxLevel:', ext.maxLevel, 'vol:', mp.volume.toFixed(6), 'Green*0.5:', (area * 0.5).toFixed(6), 'delta%:', (100 * (mp.volume - area * 0.5) / (area * 0.5)).toFixed(3))
  await snapshot('02-plate')
  filewrite({ lobeR, segCount: sp.result?.length, trimmed: toTrim.length, boundary: boundary.length, closed, area, vol: mp.volume }, 'outer')
  return {}
}
