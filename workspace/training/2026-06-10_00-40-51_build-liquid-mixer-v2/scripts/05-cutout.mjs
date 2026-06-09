// Back cutout: rect 90x40 centered (x 15..105, y 20..60) with two Ø8 ear half-circles on the
// LEFT edge, centers (15,24) & (15,56), bulging to x=11. Depth 5 from back face (z=0..5). SUBTRACT.
// Cutout area = 3600 + pi*16 = 3650.2655; removed vol = 18251.327.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LiquidMixerV2' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const noGenL = { genFixation: false, genIncidence: false, genVertAndHoriz: false }
  const noGenA = { genFixation: false, genIncidence: false }

  // --- block ---
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
  const blockExt = (await api.v1.part.extrusion({
    id: partId, name: 'Block', references: [...lines1, ...arcs1], type: 'UP', limit2: 35,
  })).result

  // --- boss ---
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
  const bossExt = (await api.v1.part.extrusion({
    id: partId, name: 'Boss', references: arcs2, type: 'UP', limit2: 10,
  })).result
  let body = (await api.v1.part.boolean({ id: partId, type: 'UNION', name: 'Body', target: blockExt, tools: [bossExt] })).result

  // --- cutout profile on Top plane (back face z=0) ---
  const sk3 = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'CutoutProfile' })).result
  const lines3 = (await api.v1.sketch.line([
    { id: sk3, startPos: [15, 20, 0], endPos: [105, 20, 0], ...noGenL },  // bottom
    { id: sk3, startPos: [105, 20, 0], endPos: [105, 60, 0], ...noGenL }, // right
    { id: sk3, startPos: [105, 60, 0], endPos: [15, 60, 0], ...noGenL },  // top
    { id: sk3, startPos: [15, 52, 0], endPos: [15, 28, 0], ...noGenL },   // left mid
  ])).result
  const arcs3R = await api.v1.sketch.arcByCenter([
    // upper ear: (15,60) -> (11,56) -> (15,52), CCW around (15,56)
    { id: sk3, startPos: [15, 60, 0], centerPos: [15, 56, 0], endPos: [15, 52, 0], isClockwise: false, ...noGenA },
    // lower ear: (15,28) -> (11,24) -> (15,20), CCW around (15,24)
    { id: sk3, startPos: [15, 28, 0], centerPos: [15, 24, 0], endPos: [15, 20, 0], isClockwise: false, ...noGenA },
  ])
  console.log('[05] cutout arcs:', JSON.stringify(arcs3R.result), 'maxLevel:', arcs3R.maxLevel)
  const cutExtR = await api.v1.part.extrusion({
    id: partId, name: 'CutoutTool', references: [...lines3, ...arcs3R.result], type: 'UP', limit2: 5,
  })
  console.log('[05] cutout extrusion:', cutExtR.result, 'maxLevel:', cutExtR.maxLevel, JSON.stringify(cutExtR.messages ?? []))

  const subR = await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', name: 'BodyCut', target: body, tools: [cutExtR.result] })
  console.log('[05] subtraction:', subR.result, 'maxLevel:', subR.maxLevel)

  // --- verify ---
  const lens = 2 * R * R * Math.acos(38 / (2 * R)) - 19 * Math.sqrt(4 * R * R - 38 * 38)
  const X = [60, 40 + Math.sqrt(R * R - 19 * 19)]
  const seg = (chord, r) => { const h = Math.asin(chord / 2 / r); return r * r * (h - Math.sin(h) * Math.cos(h)) }
  const patch = 0.5 * (T2t[0] - T1t[0]) * (T1t[1] - X[1]) - seg(T2t[0] - T1t[0], RF) - 2 * seg(Math.hypot(X[0] - T1t[0], X[1] - T1t[1]), R)
  const peanutArea = 2 * Math.PI * R * R - lens + 2 * patch
  const blockVol = (9600 - 2 * (100 - 25 * Math.PI)) * 35
  const cutArea = 3600 + Math.PI * 16
  const expVol = blockVol + peanutArea * 10 - cutArea * 5
  // moments (x and z), analytic
  const cutCx = (3600 * 60 + 2 * Math.PI * 8 * (15 - 16 / (3 * Math.PI))) / cutArea
  const expMx = blockVol * 60.259623 + peanutArea * 10 * 60 - cutArea * 5 * cutCx
  const expMz = blockVol * 17.5 + peanutArea * 10 * 40 - cutArea * 5 * 2.5
  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  console.log('[05] vol:', mp.volume.toFixed(2), 'expected:', expVol.toFixed(2), 'delta%:', (100 * (mp.volume - expVol) / expVol).toFixed(4))
  console.log('[05] COG:', JSON.stringify(mp.cog), `expected ~(${(expMx / expVol).toFixed(3)}, 40.000, ${(expMz / expVol).toFixed(3)})`)

  filewrite({ vol: mp.volume, expVol, cog: mp.cog, expCog: [expMx / expVol, 40, expMz / expVol] }, 'cutout-verify')
  await snapshot('05-cutout-iso')
  await snapshot('05-cutout-back', { view: 'bottom' })
  return { partId }
}
