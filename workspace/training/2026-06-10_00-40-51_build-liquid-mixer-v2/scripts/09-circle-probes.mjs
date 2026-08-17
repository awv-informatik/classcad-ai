// FINAL: complete part in one script + numeric spatial audit.
// Audit = getGeometryIds existence probes (recalc first): every face extent, feature floor,
// and key vertex checked against the B-rep at its exact expected position.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LiquidMixerV2' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const noGenL = { genFixation: false, genIncidence: false, genVertAndHoriz: false }
  const noGenA = { genFixation: false, genIncidence: false }

  // block
  const sk1 = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'BlockProfile' })).result
  const lines1 = (await api.v1.sketch.line([
    { id: sk1, startPos: [10, 0, 0], endPos: [120, 0, 0], ...noGenL },
    { id: sk1, startPos: [120, 0, 0], endPos: [120, 80, 0], ...noGenL },
    { id: sk1, startPos: [120, 80, 0], endPos: [10, 80, 0], ...noGenL },
    { id: sk1, startPos: [0, 70, 0], endPos: [0, 10, 0], ...noGenL },
  ])).result
  const arcs1 = (await api.v1.sketch.arcByCenter([
    { id: sk1, startPos: [10, 80, 0], centerPos: [10, 70, 0], endPos: [0, 70, 0], isClockwise: false, ...noGenA },
    { id: sk1, startPos: [0, 10, 0], centerPos: [10, 10, 0], endPos: [10, 0, 0], isClockwise: false, ...noGenA },
  ])).result
  const blockExt = (await api.v1.part.extrusion({ id: partId, name: 'Block', references: [...lines1, ...arcs1], type: 'UP', limit2: 35 })).result

  // boss
  const R = 22.5, RF = 10
  const fy = Math.sqrt(32.5 ** 2 - 19 ** 2), k = R / 32.5
  const T1t = [41 + k * 19, 40 + k * fy], T2t = [79 - k * 19, 40 + k * fy]
  const T1b = [41 + k * 19, 40 - k * fy], T2b = [79 - k * 19, 40 - k * fy]
  const wp35 = (await api.v1.part.workPlane({ id: partId, name: 'BossPlane', normal: [0, 0, 1], offset: 35 })).result
  const sk2 = (await api.v1.sketch.create({ id: partId, planeId: wp35, name: 'BossProfile' })).result
  const arcs2 = (await api.v1.sketch.arcByCenter([
    { id: sk2, startPos: [...T1t, 0], centerPos: [41, 40, 0], endPos: [...T1b, 0], isClockwise: false, ...noGenA },
    { id: sk2, startPos: [...T1b, 0], centerPos: [60, 40 - fy, 0], endPos: [...T2b, 0], isClockwise: true, ...noGenA },
    { id: sk2, startPos: [...T2b, 0], centerPos: [79, 40, 0], endPos: [...T2t, 0], isClockwise: false, ...noGenA },
    { id: sk2, startPos: [...T2t, 0], centerPos: [60, 40 + fy, 0], endPos: [...T1t, 0], isClockwise: true, ...noGenA },
  ])).result
  const bossExt = (await api.v1.part.extrusion({ id: partId, name: 'Boss', references: arcs2, type: 'UP', limit2: 10 })).result
  let body = (await api.v1.part.boolean({ id: partId, type: 'UNION', name: 'Body', target: blockExt, tools: [bossExt] })).result

  // cutout
  const sk3 = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'CutoutProfile' })).result
  const lines3 = (await api.v1.sketch.line([
    { id: sk3, startPos: [15, 20, 0], endPos: [105, 20, 0], ...noGenL },
    { id: sk3, startPos: [105, 20, 0], endPos: [105, 60, 0], ...noGenL },
    { id: sk3, startPos: [105, 60, 0], endPos: [15, 60, 0], ...noGenL },
    { id: sk3, startPos: [15, 52, 0], endPos: [15, 28, 0], ...noGenL },
  ])).result
  const arcs3 = (await api.v1.sketch.arcByCenter([
    { id: sk3, startPos: [15, 60, 0], centerPos: [15, 56, 0], endPos: [15, 52, 0], isClockwise: false, ...noGenA },
    { id: sk3, startPos: [15, 28, 0], centerPos: [15, 24, 0], endPos: [15, 20, 0], isClockwise: false, ...noGenA },
  ])).result
  const cutExt = (await api.v1.part.extrusion({ id: partId, name: 'CutoutTool', references: [...lines3, ...arcs3], type: 'UP', limit2: 5 })).result
  body = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', name: 'BodyCut', target: body, tools: [cutExt] })).result

  // holes
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
  const finalR = await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', name: 'BodyFinal', target: body, tools: tools7 })
  console.log('[08] final boolean:', finalR.result, 'maxLevel:', finalR.maxLevel)

  // ---------- numeric spatial audit ----------
  await api.v1.common.recalc({})

  const planeProbes = [
    ['x=0 left face', [0, 40, 17.5]],
    ['y=0 bottom face', [60, 0, 17.5]],
    ['y=80 top face', [60, 80, 17.5]],
    ['z=0 back face', [60, 70, 0]],
    ['z=35 front face', [110, 40, 35]],
    ['z=45 boss face', [60, 40, 45]],
    ['cutout floor z=5', [60, 40, 5]],
    ['bore floor x=20 (depth 100)', [20, 40, 20]],
    ['cbore floor z=26.5 (depth 8.5)', [15, 70, 26.5]],
    ['pilot floor x=102 (G1/2 depth 18)', [102, 47, 20]],
    ['shaft floor z=35 (depth 10)', [41 + 2, 40, 35]],
    ['M4 floor z=33 (depth 12)', [41, 40 + 12, 33]],
  ]
  const pointProbes = [
    ['corner (120,0,0)', [120, 0, 0]],
    ['corner (120,80,0)', [120, 80, 0]],
    ['corner (120,0,35)', [120, 0, 35]],
    ['corner (120,80,35)', [120, 80, 35]],
    ['boss tangent T1t @ z45', [T1t[0], T1t[1], 45]],
  ]
  const circleProbes = [
    ['port mouth rim Ø18.63 @ x=120 (rim pt 90°)', [120, 40 + 9.315, 20]],
    ['csk rim Ø10 @ boss face (rim pt)', [79, 40 + 5, 45]],
    ['csk/shaft meet Ø8.1 @ z=44.05 (rim pt)', [41, 40 + 4.05, 45 - 0.95]],
    ['bore floor rim Ø12 @ x=20 (rim pt)', [20, 40 + 6, 20]],
  ]
  const gR = await api.v1.part.getGeometryIds({
    id: partId,
    planes: planeProbes.map(([, p]) => ({ positions: [p] })),
    points: pointProbes.map(([, p]) => ({ pos: p })),
    circles: circleProbes.map(([, p]) => ({ pos: p })),
  })
  const audit = []
  planeProbes.forEach(([label], i) => audit.push([label, (gR.result.planes?.[i] ?? []).length !== 0 || typeof gR.result.planes?.[i] === 'number']))
  pointProbes.forEach(([label], i) => audit.push([label, (gR.result.points?.[i] ?? []).length !== 0 || typeof gR.result.points?.[i] === 'number']))
  circleProbes.forEach(([label], i) => audit.push([label, (gR.result.circles?.[i] ?? []).length !== 0 || typeof gR.result.circles?.[i] === 'number']))
  for (const [label, ok] of audit) console.log(`[08] ${ok ? '✓' : '❌'} ${label}`)
  console.log('[08] audit:', audit.filter(([, ok]) => ok).length, '/', audit.length, 'passed; getGeometryIds maxLevel:', gR.maxLevel)

  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  console.log('[08] FINAL vol:', mp.volume.toFixed(2), 'COG:', JSON.stringify(mp.cog))

  filewrite({ raw: gR.result, audit: Object.fromEntries(audit.map(([l, ok]) => [l, ok])), vol: mp.volume, cog: mp.cog }, 'final-audit')
  await snapshot('09-circle-probes-iso')
  await snapshot('09-circle-probes-front', { view: 'front' })
  await snapshot('09-circle-probes-bottom', { view: 'bottom' })
  await snapshot('09-circle-probes-right', { view: 'right' })
  return { partId, audit: audit.filter(([, ok]) => ok).length + '/' + audit.length }
}
