// Lever bracket — outer-contour layout, fully constraint-driven.
// Rough seeds; driving dims = the drawing's numbers. Tangency derives: lobe outer arc radius,
// all 4 transition-fillet centers, all tangent web lines.
// Readback gate: every derived element vs analytic tri-tangency solutions.
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

  // ---------- analytic targets ----------
  const circXcirc = (c1, r1, c2, r2, pickNear) => { // intersection of two circles, branch nearest pickNear
    const dx = c2[0] - c1[0], dy = c2[1] - c1[1], d = Math.hypot(dx, dy)
    const a = (d * d + r1 * r1 - r2 * r2) / (2 * d)
    const h = Math.sqrt(Math.max(0, r1 * r1 - a * a))
    const bx = c1[0] + a * dx / d, by = c1[1] + a * dy / d
    const s1 = [bx - h * dy / d, by + h * dx / d], s2 = [bx + h * dy / d, by - h * dx / d]
    const d1 = Math.hypot(s1[0] - pickNear[0], s1[1] - pickNear[1])
    const d2 = Math.hypot(s2[0] - pickNear[0], s2[1] - pickNear[1])
    return d1 <= d2 ? s1 : s2
  }
  const a40 = 40 * Math.PI / 180
  const UP = [2.312 * Math.cos(a40), 2.312 * Math.sin(a40)]
  const exp = {
    topO: [-0.750, 1.875], lCap: [-1.867, 0], rCap: [-0.867, 0], lowCap: [2.312, 0], upCap: UP,
    f1750: circXcirc([-1.867, 0], 1.75 + 0.75, [-0.75, 1.875], 1.75 + 0.8125, [-3.2, 2.0]),
    f625a: circXcirc([-0.75, 1.875], 0.625 + 0.8125, UP, 0.625 + 0.875, [0.6, 2.4]),
    f625b: circXcirc([0, 0], 0.625 + 0.875, UP, 0.625 + 0.875, [0.3, 1.5]),
    f1375: circXcirc([0, 0], 1.375 + 0.875, [2.312, 0], 1.375 + 0.875, [1.2, -1.9]),
  }

  // ---------- readbacks ----------
  let pass = 0, total = 0
  const got = {}
  for (const [k, t] of Object.entries(exp)) {
    const p = (await pos(C[k] ?? await ctr({ topO, lCap, rCap, lowCap, upCap, f1750, f625a, f625b, f1375 }[k]))).pos
    got[k] = [p.x, p.y]
    const ok = Math.abs(p.x - t[0]) < 1e-6 && Math.abs(p.y - t[1]) < 1e-6
    total++; if (ok) pass++
    console.log(`[01] ${ok ? '✓' : '❌'} ${k} center → (${p.x.toFixed(6)}, ${p.y.toFixed(6)}) target (${t[0].toFixed(6)}, ${t[1].toFixed(6)})`)
  }
  // lobe outer radius (internal-tangency question): read from structure
  const tree = Object.values((await api.v1.sketch.getGeometry({ id: sk })).structure?.tree ?? {})
  const lobeR = tree.find(n => n?.id === lobeO)?.members?.radius?.value
  const okR = Math.abs(lobeR - 3.187) < 1e-6
  total++; if (okR) pass++
  console.log(`[01] ${okR ? '✓' : '❌'} lobe outer radius → ${lobeR} (target 3.187; 1.437 would mean internal tangency unreachable)`)
  // web line tangency residuals
  for (const [name, lid, c, r] of [['botLine-lCap', botLine, [-1.867, 0], 0.75], ['botLine-rCap', botLine, [-0.867, 0], 0.75], ['webLine-main', webLine, [0, 0], 0.875]]) {
    const q = await pos(lid)
    const dx = q.endPos.x - q.startPos.x, dy = q.endPos.y - q.startPos.y, L = Math.hypot(dx, dy)
    const dist = Math.abs((c[0] - q.startPos.x) * dy - (c[1] - q.startPos.y) * dx) / L
    const ok = Math.abs(dist - r) < 1e-6
    total++; if (ok) pass++
    console.log(`[01] ${ok ? '✓' : '❌'} ${name} distance → ${dist.toFixed(6)} (target ${r})`)
  }
  // 5.804 overall-extent CHECK (demoted dimension)
  const overall = (3.187) - (got.lCap[0] - 0.75)
  const ok58 = Math.abs(overall - 5.804) < 1e-6
  total++; if (ok58) pass++
  console.log(`[01] ${ok58 ? '✓' : '❌'} 5.804 overall extent readback → ${overall.toFixed(6)}`)
  console.log('[01] layout checks:', pass, '/', total)

  filewrite({ got, exp, lobeR, overall, pass, total }, 'layout')
  await snapshot('01-layout')
  return { pass, total }
}
