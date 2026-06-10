// Lever bracket 04 — solid from the DERIVED exact chain.
// The constrained master sketch solves the layout (verified 14/14); the boundary is then an
// exact 14-element arc/line chain computed from SOLVED data and built in a second sketch.
// (Trim on the heavy constrained sketch hangs the worker — documented; this route avoids it
// while keeping all conditioning in the master.)
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
  const f625a = (await api.v1.sketch.circle({ id: sk, centerPos: [0.62, 1.35, 0], radius: 0.55 })).result
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
    { id: sk, type: 'TANGENT', geomIds: [f625a, mainO] },
    
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
  console.log('[04] relations maxLevel:', rel.maxLevel)

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
  console.log('[04] dims maxLevel:', dims.maxLevel)

  // ---------- read solved data ----------
  const got = { mainO: [0, 0] }
  for (const k of ['topO', 'lCap', 'rCap', 'lowCap', 'upCap', 'f1750', 'f625a', 'f625b', 'f1375']) {
    const p = (await pos(C[k])).pos
    got[k] = [p.x, p.y]
  }
  const treeG = Object.values((await api.v1.sketch.getGeometry({ id: sk })).structure?.tree ?? {})
  const lobeR = treeG.find(n => n?.id === lobeO)?.members?.radius?.value
  const lineQ = { bot: await pos(botLine), web: await pos(webLine) }

  // ---------- derive the 14-element boundary chain ----------
  const R = { topO: 0.8125, lCap: 0.75, rCap: 0.75, lowCap: 0.875, upCap: 0.875, mainO: 0.875 }
  const RF = { f1750: 1.75, f625a: 0.625, f625b: 0.625, f1375: 1.375 }
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
  const mag = v => Math.hypot(v[0], v[1])
  const unit = v => { const m = mag(v); return [v[0] / m, v[1] / m] }
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]]
  const scl = (v, s) => [v[0] * s, v[1] * s]
  const foot = (c, q) => { // foot of perpendicular from point c onto line q
    const A = [q.startPos.x, q.startPos.y], B = [q.endPos.x, q.endPos.y]
    const d = unit(sub(B, A))
    const t = (c[0] - A[0]) * d[0] + (c[1] - A[1]) * d[1]
    return add(A, scl(d, t))
  }
  const onCirc = (c, rr, towards) => add(c, scl(unit(sub(towards, c)), rr))
  const T = {
    botL: foot(got.lCap, lineQ.bot), botR: foot(got.rCap, lineQ.bot),
    webR: foot(got.rCap, lineQ.web), webM: foot(got.mainO, lineQ.web),
    m1375: onCirc(got.mainO, R.mainO, got.f1375), low1375: onCirc(got.lowCap, R.lowCap, got.f1375),
    lowLobe: scl(unit(got.lowCap), lobeR), upLobe: scl(unit(got.upCap), lobeR),
    up625b: onCirc(got.upCap, R.upCap, got.f625b), m625b: onCirc(got.mainO, R.mainO, got.f625b),
    m625a: onCirc(got.mainO, R.mainO, got.f625a), top625a: onCirc(got.topO, R.topO, got.f625a),
    top1750: onCirc(got.topO, R.topO, got.f1750), lCap1750: onCirc(got.lCap, R.lCap, got.f1750),
  }
  filewrite({ got, lobeR, T }, 'derived')

  // chain spec: [type, start, end, center, isClockwise]
  const chain = [
    ['line', T.botL, T.botR],
    ['arc', T.botR, T.webR, got.rCap, false],
    ['line', T.webR, T.webM],
    ['arc', T.webM, T.m1375, got.mainO, false],
    ['arc', T.m1375, T.low1375, got.f1375, true],
    ['arc', T.low1375, T.lowLobe, got.lowCap, false],
    ['arc', T.lowLobe, T.upLobe, got.mainO.map(v => v), false], // lobe arc about origin
    ['arc', T.upLobe, T.up625b, got.upCap, false],
    ['arc', T.up625b, T.m625b, got.f625b, true],
    ['arc', T.m625b, T.m625a, got.mainO, true],
    ['arc', T.m625a, T.top625a, got.f625a, true],
    ['arc', T.top625a, T.top1750, got.topO, false],
    ['arc', T.top1750, T.lCap1750, got.f1750, true],
    ['arc', T.lCap1750, T.botL, got.lCap, false],
  ]
  const sk2 = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'Profile' })).result
  const ids = []
  for (const el of chain) {
    if (el[0] === 'line') {
      ids.push((await api.v1.sketch.line({ id: sk2, startPos: [...el[1], 0], endPos: [...el[2], 0] })).result)
    } else {
      const r = await api.v1.sketch.arcByCenter({
        id: sk2, startPos: [...el[1], 0], endPos: [...el[2], 0], centerPos: [...el[3], 0], isClockwise: el[4],
      })
      if (r.result == null) console.log('[04] ❌ arc failed:', JSON.stringify(el), JSON.stringify(r.messages ?? []))
      ids.push(r.result)
    }
  }
  console.log('[04] chain built:', ids.filter(x => x != null).length, '/ 14')

  // Green's theorem area of the chain (pure math, signed)
  let A2 = 0
  for (const el of chain) {
    const [P1, P2] = [el[1], el[2]]
    if (el[0] === 'line') { A2 += P1[0] * P2[1] - P2[0] * P1[1]; continue }
    const Cc = el[3], cw = el[4]
    const rr = mag(sub(P1, Cc))
    const th1 = Math.atan2(P1[1] - Cc[1], P1[0] - Cc[0]), th2 = Math.atan2(P2[1] - Cc[1], P2[0] - Cc[0])
    const n2 = a => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    const delta = cw ? -n2(th1 - th2) : n2(th2 - th1)
    A2 += Cc[0] * (P2[1] - P1[1]) - Cc[1] * (P2[0] - P1[0]) + rr * rr * delta
  }
  const area = Math.abs(A2) / 2
  console.log('[04] Green area of outer profile:', area.toFixed(6))

  // extrude t=0.5
  const ext = await api.v1.part.extrusion({ id: partId, name: 'Plate', references: ids, type: 'UP', limit2: 0.5 })
  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  console.log('[04] extrusion maxLevel:', ext.maxLevel, 'vol:', mp?.volume?.toFixed(6), 'Green*0.5:', (area * 0.5).toFixed(6), 'delta%:', mp ? (100 * (mp.volume - area * 0.5) / (area * 0.5)).toFixed(3) : 'n/a')
  await snapshot('04-plate')
  await snapshot('04-plate-top', { view: 'top' })
  filewrite({ area, vol: mp?.volume }, 'plate')
  return {}
}
