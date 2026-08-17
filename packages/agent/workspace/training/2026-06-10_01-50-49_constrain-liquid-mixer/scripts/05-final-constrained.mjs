// FINAL constrained build: all three sketches solver-laid-out (proven 8/8, 7/7, 8/8),
// + feature holes as in the verified hardcoded build. Equivalence gate:
// mass props vs 326305.89 / COG (59.511, 39.999, 20.190) + the 21/21 geometry audit.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LiquidMixerV2c' })).result
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

  const bossExt = (await api.v1.part.extrusion({ id: partId, name: 'Boss', references: [boss1, filB, boss2, filT], type: 'UP', limit2: 10 })).result
  const bodyU = (await api.v1.part.boolean({ id: partId, type: 'UNION', name: 'Body', target: blockExt, tools: [bossExt] })).result

  // ---- cutout (constrained, as 04) ----
  const sk3 = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'CutoutProfile' })).result
  // rough seeds; datum corner (105,20) exact on the bottom2 line end
  const bottom2 = (await api.v1.sketch.line({ id: sk3, startPos: [18, 22, 0], endPos: [105, 20, 0] })).result
  const right2 = (await api.v1.sketch.line({ id: sk3, startPos: [104, 21, 0], endPos: [106, 58, 0] })).result
  const top2 = (await api.v1.sketch.line({ id: sk3, startPos: [103, 61, 0], endPos: [17, 59, 0] })).result
  const earT = (await api.v1.sketch.arcByCenter({ id: sk3, ...arc(16, 55, 5, 90, 270) })).result // CCW via 180
  const leftL = (await api.v1.sketch.line({ id: sk3, startPos: [14, 51, 0], endPos: [16, 29, 0] })).result
  const earB = (await api.v1.sketch.arcByCenter({ id: sk3, ...arc(14, 25, 3, 90, 270) })).result // CCW via 180
  const P3 = {}
  for (const [k, id] of Object.entries({ bottom2, right2, top2, earT, leftL, earB }))
    P3[k] = (await api.v1.sketch.getPoints({ id })).result

  const fx3 = await api.v1.sketch.constraint({ id: sk3, type: 'FIXATION', geomIds: [P3.bottom2.endId] })
  const rel3 = await api.v1.sketch.constraint([
    { id: sk3, type: 'COINCIDENT', geomIds: [P3.bottom2.endId, P3.right2.startId] },
    { id: sk3, type: 'COINCIDENT', geomIds: [P3.right2.endId, P3.top2.startId] },
    { id: sk3, type: 'COINCIDENT', geomIds: [P3.top2.endId, P3.earT.startId] },
    { id: sk3, type: 'COINCIDENT', geomIds: [P3.earT.endId, P3.leftL.startId] },
    { id: sk3, type: 'COINCIDENT', geomIds: [P3.leftL.endId, P3.earB.startId] },
    { id: sk3, type: 'COINCIDENT', geomIds: [P3.earB.endId, P3.bottom2.startId] },
    { id: sk3, type: 'HORIZONTAL', geomIds: [bottom2] },
    { id: sk3, type: 'HORIZONTAL', geomIds: [top2] },
    { id: sk3, type: 'VERTICAL', geomIds: [right2] },
    { id: sk3, type: 'VERTICAL', geomIds: [leftL] },
    { id: sk3, type: 'TANGENT', geomIds: [earT, top2] },
    { id: sk3, type: 'TANGENT', geomIds: [earB, bottom2] },
    // drawing fact "ears bulge outward only" == ear centers lie ON the left edge line
    { id: sk3, type: 'COINCIDENT', geomIds: [P3.earT.centerId, leftL] },
    { id: sk3, type: 'COINCIDENT', geomIds: [P3.earB.centerId, leftL] },
  ])
  const dims3 = await api.v1.sketch.dimension([
    { id: sk3, name: 'R4_t', type: 'RADIUS', geomIds: [earT], value: 4 },
    { id: sk3, name: 'R4_b', type: 'RADIUS', geomIds: [earB], value: 4 },
    { id: sk3, name: 'w90', type: 'HORIZONTAL_DISTANCE', geomIds: [bottom2], value: 90 },
    { id: sk3, name: 'h40', type: 'VERTICAL_DISTANCE', geomIds: [right2], value: 40 },
  ])
  console.log('[04] fixation:', fx3.maxLevel, 'relations:', rel3.maxLevel, 'dims3:', dims3.maxLevel)

  const cutExt = (await api.v1.part.extrusion({ id: partId, name: 'CutoutTool', references: [bottom2, right2, top2, earT, leftL, earB], type: 'UP', limit2: 5 })).result
  let body = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', name: 'BodyCut', target: bodyU, tools: [cutExt] })).result

  // ---- feature holes (identical to verified hardcoded build) ----
  const zHole = async (name, x, y, zBase, d, h) => {
    const wcs = (await api.v1.part.workCSys({ id: partId, name: `WCS_${name}`, offset: [x, y, zBase] })).result
    return (await api.v1.part.cylinder({ id: partId, name, references: [wcs], diameter: d, height: h })).result
  }
  const xHole = async (name, xBase, y, z, d, h) => {
    const wcs = (await api.v1.part.workCSys({ id: partId, name: `WCS_${name}`, offset: [xBase, y, z], rotation: [0, Math.PI / 2, 0] })).result
    return (await api.v1.part.cylinder({ id: partId, name, references: [wcs], diameter: d, height: h })).result
  }
  const tools6 = [
    await zHole('ThruTL', 10, 70, -0.5, 8, 36),
    await zHole('ThruBR', 110, 10, -0.5, 8, 36),
    await zHole('CboreTL', 10, 70, 26.5, 13.5, 10),
    await zHole('CboreBR', 110, 10, 26.5, 13.5, 10),
    await xHole('PortPilot', 102, 40, 20, 18.63, 19),
    await xHole('ChamberBore', 20, 40, 20, 12, 101),
  ]
  body = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', name: 'BodyDrilled', target: body, tools: tools6 })).result
  const tools7 = []
  for (const hx of [41, 79]) {
    tools7.push(await zHole(`Shaft${hx}`, hx, 40, 35, 8.1, 11))
    const wcsC = (await api.v1.part.workCSys({ id: partId, name: `WCS_Csk${hx}`, offset: [hx, 40, 40.5] })).result
    tools7.push((await api.v1.part.cone({ id: partId, name: `Csk${hx}`, references: [wcsC], bDiameter: 1, tDiameter: 12, height: 5.5 })).result)
    for (const deg of [90, 210, 330]) {
      const a = deg * Math.PI / 180
      tools7.push(await zHole(`M4_${hx}_${deg}`, hx + 12 * Math.cos(a), 40 + 12 * Math.sin(a), 33, 3.3, 13))
    }
  }
  const fin = await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', name: 'BodyFinal', target: body, tools: tools7 })
  console.log('[05] final boolean maxLevel:', fin.maxLevel)

  // ---- equivalence audit (same probes as hardcoded build: 21 checks) ----
  await api.v1.common.recalc({})
  const fy2 = Math.sqrt(32.5 ** 2 - 19 ** 2), k9 = 22.5 / 32.5
  const T1tA = [41 + k9 * 19, 40 + k9 * fy2]
  const planeProbes = [
    ['x=0 left face', [0, 40, 17.5]], ['y=0 bottom face', [60, 0, 17.5]],
    ['y=80 top face', [60, 80, 17.5]], ['z=0 back face', [60, 70, 0]],
    ['z=35 front face', [110, 40, 35]], ['z=45 boss face', [60, 40, 45]],
    ['cutout floor z=5', [60, 40, 5]], ['bore floor x=20', [20, 40, 20]],
    ['cbore floor z=26.5', [15, 70, 26.5]], ['pilot floor x=102', [102, 47, 20]],
    ['shaft floor z=35', [43, 40, 35]], ['M4 floor z=33', [41, 52, 33]],
  ]
  const pointProbes = [
    ['corner (120,0,0)', [120, 0, 0]], ['corner (120,80,0)', [120, 80, 0]],
    ['corner (120,0,35)', [120, 0, 35]], ['corner (120,80,35)', [120, 80, 35]],
    ['boss tangent T1t @ z45', [T1tA[0], T1tA[1], 45]],
  ]
  const circleProbes = [
    ['port mouth rim', [120, 40 + 9.315, 20]], ['csk rim Ø10', [79, 45, 45]],
    ['csk/shaft meet z=44.05', [41, 44.05, 44.05 - 0]], ['bore floor rim', [20, 46, 20]],
  ]
  circleProbes[2][1] = [41, 40 + 4.05, 44.05]
  const gR = await api.v1.part.getGeometryIds({
    id: partId,
    planes: planeProbes.map(([, p]) => ({ positions: [p] })),
    points: pointProbes.map(([, p]) => ({ pos: p })),
    circles: circleProbes.map(([, p]) => ({ pos: p })),
  })
  const ok = v => (v ?? []).length !== 0 || typeof v === 'number'
  let pass = 0, total = 0
  planeProbes.forEach(([l], i) => { total++; if (ok(gR.result.planes?.[i])) pass++; else console.log('[05] ❌', l) })
  pointProbes.forEach(([l], i) => { total++; if (ok(gR.result.points?.[i])) pass++; else console.log('[05] ❌', l) })
  circleProbes.forEach(([l], i) => { total++; if (ok(gR.result.circles?.[i])) pass++; else console.log('[05] ❌', l) })
  console.log('[05] audit:', pass, '/', total, 'maxLevel:', gR.maxLevel)

  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  console.log('[05] FINAL vol:', mp.volume.toFixed(2), '(hardcoded: 326305.89) COG:', JSON.stringify(mp.cog))
  console.log('[05] equivalent:', Math.abs(mp.volume - 326305.89) < 1, '&& COG match:', Math.abs(mp.cog.x - 59.511) < 0.01 && Math.abs(mp.cog.y - 39.9985) < 0.01 && Math.abs(mp.cog.z - 20.1898) < 0.01)

  filewrite({ vol: mp.volume, cog: mp.cog, audit: pass + '/' + total }, 'final-verify')
  await snapshot('05-final-iso')
  await snapshot('05-final-top', { view: 'top' })
  await snapshot('05-final-bottom', { view: 'bottom' })
  await snapshot('05-final-right', { view: 'right' })
  return { audit: pass + '/' + total, vol: mp.volume }
}
