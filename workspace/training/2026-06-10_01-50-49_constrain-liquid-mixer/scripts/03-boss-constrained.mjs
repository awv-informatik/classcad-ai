// Constrained boss: 4 rough arcs → COINCIDENT chain + TANGENT at all 4 joins +
// FIX hub1 center + HD38/VD0 to hub2 + Ø45 ×2 + R10 ×2 → solver lays out the peanut.
// No trim, no precomputed tangent points. Verify all 4 joins + 4 centers vs analytic, extrude+union.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MixerConstrained' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const arc = (cx, cy, r, aDeg, bDeg, cw = false) => ({
    startPos: [cx + r * Math.cos(aDeg * Math.PI / 180), cy + r * Math.sin(aDeg * Math.PI / 180), 0],
    endPos: [cx + r * Math.cos(bDeg * Math.PI / 180), cy + r * Math.sin(bDeg * Math.PI / 180), 0],
    centerPos: [cx, cy, 0], isClockwise: cw,
  })

  // ---- block (constrained, as 02) ----
  const sk1 = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'BlockProfile' })).result
  const bottom = (await api.v1.sketch.line({ id: sk1, startPos: [14, 2, 0], endPos: [120, 0, 0] })).result
  const right = (await api.v1.sketch.line({ id: sk1, startPos: [119, 3, 0], endPos: [121, 77, 0] })).result
  const top = (await api.v1.sketch.line({ id: sk1, startPos: [116, 81, 0], endPos: [12, 83, 0] })).result
  const left = (await api.v1.sketch.line({ id: sk1, startPos: [-2, 67, 0], endPos: [1, 13, 0] })).result
  const tl = (await api.v1.sketch.arcByCenter({ id: sk1, ...arc(13, 67, 8, 90, 180) })).result
  const bl = (await api.v1.sketch.arcByCenter({ id: sk1, ...arc(12, 14, 12, 180, 270) })).result
  const P = {}
  for (const [k, id] of Object.entries({ bottom, right, top, left, tl, bl }))
    P[k] = (await api.v1.sketch.getPoints({ id })).result
  await api.v1.sketch.constraint({ id: sk1, type: 'FIXATION', geomIds: [P.bottom.endId] })
  await api.v1.sketch.constraint([
    { id: sk1, type: 'COINCIDENT', geomIds: [P.bottom.endId, P.right.startId] },
    { id: sk1, type: 'COINCIDENT', geomIds: [P.right.endId, P.top.startId] },
    { id: sk1, type: 'COINCIDENT', geomIds: [P.top.endId, P.tl.startId] },
    { id: sk1, type: 'COINCIDENT', geomIds: [P.tl.endId, P.left.startId] },
    { id: sk1, type: 'COINCIDENT', geomIds: [P.left.endId, P.bl.startId] },
    { id: sk1, type: 'COINCIDENT', geomIds: [P.bl.endId, P.bottom.startId] },
    { id: sk1, type: 'HORIZONTAL', geomIds: [bottom] },
    { id: sk1, type: 'HORIZONTAL', geomIds: [top] },
    { id: sk1, type: 'VERTICAL', geomIds: [right] },
    { id: sk1, type: 'VERTICAL', geomIds: [left] },
    { id: sk1, type: 'TANGENT', geomIds: [tl, top] },
    { id: sk1, type: 'TANGENT', geomIds: [tl, left] },
    { id: sk1, type: 'TANGENT', geomIds: [bl, left] },
    { id: sk1, type: 'TANGENT', geomIds: [bl, bottom] },
  ])
  await api.v1.sketch.dimension([
    { id: sk1, type: 'RADIUS', geomIds: [tl], value: 10 },
    { id: sk1, type: 'RADIUS', geomIds: [bl], value: 10 },
    { id: sk1, type: 'HORIZONTAL_DISTANCE', geomIds: [P.left.startId, P.bottom.endId], value: 120 },
    { id: sk1, type: 'VERTICAL_DISTANCE', geomIds: [right], value: 80 },
  ])
  const blockExt = (await api.v1.part.extrusion({ id: partId, name: 'Block', references: [bottom, right, top, left, tl, bl], type: 'UP', limit2: 35 })).result

  // ---- boss (constrained 4-arc chain) ----
  const wp35 = (await api.v1.part.workPlane({ id: partId, name: 'BossPlane', normal: [0, 0, 1], offset: 35 })).result
  const sk2 = (await api.v1.sketch.create({ id: partId, planeId: wp35, name: 'BossProfile' })).result

  // rough seeds; hub1 center exact (datum), everything else off
  const boss1 = (await api.v1.sketch.arcByCenter({ id: sk2, ...arc(41, 40, 20, 60, 300) })).result        // CCW via 180
  const filB = (await api.v1.sketch.arcByCenter({ id: sk2, ...arc(61, 16, 8, 120, 60, true) })).result    // CW via 90
  const boss2 = (await api.v1.sketch.arcByCenter({ id: sk2, ...arc(77, 42, 21, 240, 120) })).result       // CCW via 0
  const filT = (await api.v1.sketch.arcByCenter({ id: sk2, ...arc(59, 64, 9, 300, 240, true) })).result   // CW via 270
  const Q = {}
  for (const [k, id] of Object.entries({ boss1, filB, boss2, filT }))
    Q[k] = (await api.v1.sketch.getPoints({ id })).result

  const fx2 = await api.v1.sketch.constraint({ id: sk2, type: 'FIXATION', geomIds: [Q.boss1.centerId] })
  const rel2 = await api.v1.sketch.constraint([
    { id: sk2, type: 'COINCIDENT', geomIds: [Q.boss1.endId, Q.filB.startId] },
    { id: sk2, type: 'COINCIDENT', geomIds: [Q.filB.endId, Q.boss2.startId] },
    { id: sk2, type: 'COINCIDENT', geomIds: [Q.boss2.endId, Q.filT.startId] },
    { id: sk2, type: 'COINCIDENT', geomIds: [Q.filT.endId, Q.boss1.startId] },
    { id: sk2, type: 'TANGENT', geomIds: [filB, boss1] },
    { id: sk2, type: 'TANGENT', geomIds: [filB, boss2] },
    { id: sk2, type: 'TANGENT', geomIds: [filT, boss2] },
    { id: sk2, type: 'TANGENT', geomIds: [filT, boss1] },
  ])
  const dims2 = await api.v1.sketch.dimension([
    { id: sk2, name: 'D45_1', type: 'DIAMETER', geomIds: [boss1], value: 45 },
    { id: sk2, name: 'D45_2', type: 'DIAMETER', geomIds: [boss2], value: 45 },
    { id: sk2, name: 'R10_b', type: 'RADIUS', geomIds: [filB], value: 10 },
    { id: sk2, name: 'R10_t', type: 'RADIUS', geomIds: [filT], value: 10 },
    { id: sk2, name: 'HD38', type: 'HORIZONTAL_DISTANCE', geomIds: [Q.boss1.centerId, Q.boss2.centerId], value: 38 },
    { id: sk2, name: 'VD0', type: 'VERTICAL_DISTANCE', geomIds: [Q.boss1.centerId, Q.boss2.centerId], value: 0 },
  ])
  console.log('[03] boss fixation:', fx2.maxLevel, 'relations:', rel2.maxLevel, 'dims:', dims2.maxLevel)

  // readback vs analytic
  const fy = Math.sqrt(32.5 ** 2 - 19 ** 2), k9 = 22.5 / 32.5
  const targets = {
    'boss2.center (79,40)': [Q.boss2.centerId, 79, 40],
    'filT.center (60,66.3676)': [Q.filT.centerId, 60, 40 + fy],
    'filB.center (60,13.6324)': [Q.filB.centerId, 60, 40 - fy],
    'join T1t': [Q.filT.endId, 41 + k9 * 19, 40 + k9 * fy],
    'join T2t': [Q.filT.startId, 79 - k9 * 19, 40 + k9 * fy],
    'join T1b': [Q.filB.startId, 41 + k9 * 19, 40 - k9 * fy],
    'join T2b': [Q.filB.endId, 79 - k9 * 19, 40 - k9 * fy],
  }
  let pass = 0, total = 0
  for (const [label, [pid, tx, ty]] of Object.entries(targets)) {
    const p = (await api.v1.sketch.getPositions({ id: pid })).result.pos
    const ok = Math.abs(p.x - tx) < 1e-6 && Math.abs(p.y - ty) < 1e-6
    total++; if (ok) pass++
    console.log(`[03] ${ok ? '✓' : '❌'} ${label} → (${p.x.toFixed(9)}, ${p.y.toFixed(9)}) target (${tx.toFixed(6)}, ${ty.toFixed(6)})`)
  }
  console.log('[03] solved-coordinate checks:', pass, '/', total)

  const bossExt = (await api.v1.part.extrusion({ id: partId, name: 'Boss', references: [boss1, filB, boss2, filT], type: 'UP', limit2: 10 })).result
  const un = await api.v1.part.boolean({ id: partId, type: 'UNION', name: 'Body', target: blockExt, tools: [bossExt] })
  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  console.log('[03] union maxLevel:', un.maxLevel, 'vol:', mp.volume.toFixed(2), '(hardcoded build: 365463.13)')

  filewrite({ pass, total, vol: mp.volume }, 'boss-verify')
  await snapshot('03-boss')
  return { pass, total }
}
