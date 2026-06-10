// SHOWCASE: full discovered-topology workflow on the mixer boss under constraints.
// 4 constrained FULL circles (fixed hubs, Ø45x2, HD38/VD0, fillets R10+TANGENTx2) →
// splitAllCurves → classify → trim 8 of 12 → mergeBack → extrude → verify volume →
// re-dimension Ø45→Ø48 → recalc → does the whole parametric chain regenerate?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PeanutE2E' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'S' })).result
  const ctr = async id => (await api.v1.sketch.getPoints({ id })).result.centerId

  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [41, 40, 0], radius: 20 })).result
  const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [75, 43, 0], radius: 21 })).result
  const ft = (await api.v1.sketch.circle({ id: skId, centerPos: [58, 60, 0], radius: 8 })).result
  const fb = (await api.v1.sketch.circle({ id: skId, centerPos: [62, 22, 0], radius: 9 })).result
  const p1 = await ctr(c1), p2 = await ctr(c2)
  await api.v1.sketch.constraint([{ id: skId, type: 'FIXATION', geomIds: [p1] }])
  const dims = await api.v1.sketch.dimension([
    { id: skId, name: 'D1', type: 'DIAMETER', geomIds: [c1], value: 45 },
    { id: skId, name: 'D2', type: 'DIAMETER', geomIds: [c2], value: 45 },
    { id: skId, name: 'HD', type: 'HORIZONTAL_DISTANCE', geomIds: [p1, p2], value: 38 },
    { id: skId, name: 'VD', type: 'VERTICAL_DISTANCE', geomIds: [p1, p2], value: 0 },
    { id: skId, name: 'Rt', type: 'RADIUS', geomIds: [ft], value: 10 },
    { id: skId, name: 'Rb', type: 'RADIUS', geomIds: [fb], value: 10 },
  ])
  const cons = await api.v1.sketch.constraint([
    { id: skId, name: 'TanT1', type: 'TANGENT', geomIds: [ft, c1] },
    { id: skId, name: 'TanT2', type: 'TANGENT', geomIds: [ft, c2] },
    { id: skId, name: 'TanB1', type: 'TANGENT', geomIds: [fb, c1] },
    { id: skId, name: 'TanB2', type: 'TANGENT', geomIds: [fb, c2] },
  ])
  console.log('[08] layout maxLevels:', dims.maxLevel, cons.maxLevel)
  await snapshot('08-layout')

  // expected layout: hubs (41,40)/(79,40) r22.5; fillet centers (60, 40±26.3676) r10
  const fy = Math.sqrt(32.5 ** 2 - 19 ** 2)
  const C = { [c1]: [41, 40], [c2]: [79, 40], [ft]: [60, 40 + fy], [fb]: [60, 40 - fy] }
  const R = { [c1]: 22.5, [c2]: 22.5, [ft]: 10, [fb]: 10 }
  const kfy = (22.5 / 32.5) * fy

  const sp = await api.v1.sketch.splitAllCurves({ id: skId })
  const tree = {}
  for (const n of Object.values(sp.structure?.tree ?? {})) if (n?.id != null) tree[n.id] = n
  console.log('[08] segments:', sp.result?.length, '(expect 12: 4+4 boss, 2+2 fillets)')

  const segMid = async (sid) => {
    const n = tree[sid]
    const [t0, t1raw] = (n.members.interval?.members ?? []).map(m => m.value)
    const w = (t1raw < t0 ? t1raw + 1 : t1raw) - t0
    const q = (await api.v1.sketch.getPositions({ id: sid })).result
    const th = p => Math.atan2(p.y - q.centerPos.y, p.x - q.centerPos.x)
    const r = n.members.radius.value
    const ts = th(q.startPos), te = th(q.endPos)
    const norm = a => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    const dCCW = norm(te - ts)
    const dir = Math.abs(dCCW / (2 * Math.PI) - w) <= Math.abs((2 * Math.PI - dCCW) / (2 * Math.PI) - w) ? 1 : -1
    const mid = dir === 1 ? ts + dCCW / 2 : ts - (2 * Math.PI - dCCW) / 2
    return { x: q.centerPos.x + r * Math.cos(mid), y: q.centerPos.y + r * Math.sin(mid) }
  }
  // final-region membership (validated against grid integration in the 04-boss build script)
  const T1tx = 41 + (22.5 / 32.5) * 19, T2tx = 79 - (22.5 / 32.5) * 19
  const insideFinal = (x, y) => {
    if ((x - 41) ** 2 + (y - 40) ** 2 <= 22.5 ** 2) return true
    if ((x - 79) ** 2 + (y - 40) ** 2 <= 22.5 ** 2) return true
    if (x >= T1tx && x <= T2tx && Math.abs(y - 40) <= kfy + 1e-9) {
      const fc = y >= 40 ? C[ft] : C[fb]
      if ((x - fc[0]) ** 2 + (y - fc[1]) ** 2 >= 100) return true
    }
    return false
  }

  // boundary test: push the segment midpoint ±eps radially from its own circle center —
  // a boundary segment has material on exactly ONE side
  const toTrim = []
  for (const sid of sp.result ?? []) {
    const n = tree[sid]
    const orig = n?.members?.partOf?.value
    if (!C[orig]) continue
    const m = await segMid(sid)
    const [cx, cy] = C[orig]
    const rr = Math.hypot(m.x - cx, m.y - cy)
    const ux = (m.x - cx) / rr, uy = (m.y - cy) / rr
    const eps = 0.01
    const inIn = insideFinal(m.x - eps * ux, m.y - eps * uy)
    const inOut = insideFinal(m.x + eps * ux, m.y + eps * uy)
    const keep = inIn !== inOut
    console.log(`[08] ${n.name} mid(${m.x.toFixed(2)}, ${m.y.toFixed(2)}) in/out=${inIn}/${inOut} → ${keep ? 'keep' : 'TRIM'}`)
    if (!keep) toTrim.push(sid)
  }
  console.log('[08] trimming', toTrim.length, 'of', sp.result?.length, '(expect 8 of 12)')
  await api.v1.sketch.trimCurves({ id: skId, curveIds: toTrim })
  const mb = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[08] mergeBack maxLevel:', mb.maxLevel)
  await snapshot('08-trimmed')

  const geom = (await api.v1.sketch.getGeometry({ id: skId })).result
  console.log('[08] geometry:', JSON.stringify(geom), '(expect 4 arcs)')
  const all = Object.values(mb.structure?.tree ?? {})
  const consNames = all.filter(n => /Constraint/.test(n?.class ?? '')).map(n => `${n.name}:lgs${n.members?.lgsState?.value}`)
  console.log('[08] constraints after:', JSON.stringify(consNames))

  // extrude the trimmed profile
  const ext = await api.v1.part.extrusion({ id: partId, name: 'Boss', references: geom.arcs, type: 'UP', limit2: 10 })
  const mp1 = (await api.v1.part.calculateMassProperties({ id: partId })).result
  const areaExp = (RR) => { // peanut area for boss radius RR, fillet 10, dist 38
    const lens = 2 * RR * RR * Math.acos(19 / RR) - 19 * Math.sqrt(4 * RR * RR - 38 * 38)
    const fyy = Math.sqrt((RR + 10) ** 2 - 361), kk = RR / (RR + 10)
    const T1t = [41 + kk * 19, 40 + kk * fyy], T2t = [79 - kk * 19, 40 + kk * fyy], X = [60, 40 + Math.sqrt(RR * RR - 361)]
    const seg = (ch, r) => { const h = Math.asin(ch / 2 / r); return r * r * (h - Math.sin(h) * Math.cos(h)) }
    const patch = 0.5 * (T2t[0] - T1t[0]) * (T1t[1] - X[1]) - seg(T2t[0] - T1t[0], 10) - 2 * seg(Math.hypot(X[0] - T1t[0], X[1] - T1t[1]), RR)
    return 2 * Math.PI * RR * RR - lens + 2 * patch
  }
  console.log('[08] extrusion maxLevel:', ext.maxLevel, 'vol:', mp1.volume.toFixed(2), 'expected:', (areaExp(22.5) * 10).toFixed(2), 'delta%:', (100 * (mp1.volume - areaExp(22.5) * 10) / (areaExp(22.5) * 10)).toFixed(3))
  await snapshot('08-extruded')

  // re-dimension Ø45→Ø48 on BOTH bosses → whole chain regenerates?
  const dimsA = all.filter(n => /FeatureDimension/.test(n?.class ?? ''))
  const d1 = dimsA.find(n => n.name === 'D1')?.id, d2 = dimsA.find(n => n.name === 'D2')?.id
  const u1 = await api.v1.sketch.updateDimension({ id: d1, value: 48 })
  const u2 = await api.v1.sketch.updateDimension({ id: d2, value: 48 })
  await api.v1.common.recalc({})
  const mp2 = (await api.v1.part.calculateMassProperties({ id: partId })).result
  console.log('[08] redim Ø45→Ø48: upd results', u1.result, u2.result, '— vol:', mp2.volume.toFixed(2), 'expected:', (areaExp(24) * 10).toFixed(2), 'delta%:', (100 * (mp2.volume - areaExp(24) * 10) / (areaExp(24) * 10)).toFixed(3))
  await snapshot('08-redim')

  filewrite({ vol1: mp1.volume, exp1: areaExp(22.5) * 10, vol2: mp2.volume, exp2: areaExp(24) * 10, consNames }, 'e2e')
  return {}
}
