// Hub features (x2 hubs at (41,40),(79,40)):
//  - Ø8.1 ↧10 from boss face z=45 (floor z=35) + csk 90° to Ø10 at the face
//    csk tool: cone bD=1 @ z=40.5 -> tD=12 @ z=46 — exact 45° side, crosses z=45 at Ø10
//  - 3x M4 pilot Ø3.3 ↧12 (z 33..45) on Ø24 BCD at 90°/210°/330°
// One SUBTRACTION, 10 tools.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LiquidMixerV2' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const noGenL = { genFixation: false, genIncidence: false, genVertAndHoriz: false }
  const noGenA = { genFixation: false, genIncidence: false }

  // --- body through script 06 ---
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

  const zHole = async (name, x, y, zBase, d, h) => {
    const wcs = (await api.v1.part.workCSys({ id: partId, name: `WCS_${name}`, offset: [x, y, zBase] })).result
    return (await api.v1.part.cylinder({ id: partId, name, references: [wcs], diameter: d, height: h })).result
  }
  const xHole = async (name, xBase, y, z, d, h) => {
    const wcs = (await api.v1.part.workCSys({ id: partId, name: `WCS_${name}`, offset: [xBase, y, z], rotation: [0, Math.PI / 2, 0] })).result
    return (await api.v1.part.cylinder({ id: partId, name, references: [wcs], diameter: d, height: h })).result
  }
  const tools6 = []
  tools6.push(await zHole('ThruTL', 10, 70, -0.5, 8, 36))
  tools6.push(await zHole('ThruBR', 110, 10, -0.5, 8, 36))
  tools6.push(await zHole('CboreTL', 10, 70, 26.5, 13.5, 10))
  tools6.push(await zHole('CboreBR', 110, 10, 26.5, 13.5, 10))
  tools6.push(await xHole('PortPilot', 102, 40, 20, 18.63, 19))
  tools6.push(await xHole('ChamberBore', 20, 40, 20, 12, 101))
  body = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', name: 'BodyDrilled', target: body, tools: tools6 })).result

  // --- hub features ---
  const hubs = [41, 79]
  const tools7 = []
  for (const hx of hubs) {
    tools7.push(await zHole(`Shaft${hx}`, hx, 40, 35, 8.1, 11))            // floor z=35 exact
    const wcsC = (await api.v1.part.workCSys({ id: partId, name: `WCS_Csk${hx}`, offset: [hx, 40, 40.5] })).result
    const coneR = await api.v1.part.cone({ id: partId, name: `Csk${hx}`, references: [wcsC], bDiameter: 1, tDiameter: 12, height: 5.5 })
    console.log(`[07] csk@${hx}: cone ${coneR.result} maxLevel ${coneR.maxLevel}`)
    tools7.push(coneR.result)
    for (const deg of [90, 210, 330]) {
      const a = deg * Math.PI / 180
      tools7.push(await zHole(`M4_${hx}_${deg}`, hx + 12 * Math.cos(a), 40 + 12 * Math.sin(a), 33, 3.3, 13))
    }
  }
  const subR = await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', name: 'BodyFinal', target: body, tools: tools7 })
  console.log('[07] subtraction:', subR.result, 'maxLevel:', subR.maxLevel, JSON.stringify(subR.messages ?? []))

  // --- verify ---
  const lens = 2 * R * R * Math.acos(38 / (2 * R)) - 19 * Math.sqrt(4 * R * R - 38 * 38)
  const X = [60, 40 + Math.sqrt(R * R - 19 * 19)]
  const seg = (chord, r) => { const h = Math.asin(chord / 2 / r); return r * r * (h - Math.sin(h) * Math.cos(h)) }
  const patch = 0.5 * (T2t[0] - T1t[0]) * (T1t[1] - X[1]) - seg(T2t[0] - T1t[0], RF) - 2 * seg(Math.hypot(X[0] - T1t[0], X[1] - T1t[1]), R)
  const peanutArea = 2 * Math.PI * R * R - lens + 2 * patch
  const blockVol = (9600 - 2 * (100 - 25 * Math.PI)) * 35
  const cutArea = 3600 + Math.PI * 16
  const cutCx = (3600 * 60 + 2 * Math.PI * 8 * (15 - 16 / (3 * Math.PI))) / cutArea
  const thru = Math.PI * 16 * 35, annulus = Math.PI * (6.75 ** 2 - 16) * 8.5
  const bore = Math.PI * 36 * 100, pilotAnn = Math.PI * (9.315 ** 2 - 36) * 18
  // csk extra beyond Ø8.1 cyl: annular cone ring z 44.05..45, numeric integral
  let cskV = 0, cskMz = 0
  for (let z = 44.05; z < 45; z += 1e-4) {
    const r = 0.5 + (z - 40.5)
    const dv = Math.PI * (r * r - 4.05 ** 2) * 1e-4
    cskV += dv; cskMz += dv * (z + 5e-5)
  }
  const shaft = Math.PI * 4.05 ** 2 * 10, m4 = Math.PI * 1.65 ** 2 * 12
  const pieces = [
    [thru, 10, 17.5], [thru, 110, 17.5],
    [annulus, 10, 30.75], [annulus, 110, 30.75],
    [bore, 70, 20], [pilotAnn, 111, 20],
    [shaft, 41, 40], [shaft, 79, 40],
    [cskV, 41, cskMz / cskV], [cskV, 79, cskMz / cskV],
    [3 * m4, 41, 39], [3 * m4, 79, 39],
  ]
  let expVol = blockVol + peanutArea * 10 - cutArea * 5
  let mx = blockVol * 60.259623 + peanutArea * 10 * 60 - cutArea * 5 * cutCx
  let mz = blockVol * 17.5 + peanutArea * 10 * 40 - cutArea * 5 * 2.5
  for (const [v, cx, cz] of pieces) { expVol -= v; mx -= v * cx; mz -= v * cz }

  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  console.log('[07] vol:', mp.volume.toFixed(2), 'expected:', expVol.toFixed(2), 'delta%:', (100 * (mp.volume - expVol) / expVol).toFixed(4))
  console.log('[07] COG:', JSON.stringify(mp.cog), `expected ~(${(mx / expVol).toFixed(3)}, 40.000, ${(mz / expVol).toFixed(3)})`)

  filewrite({ vol: mp.volume, expVol, cog: mp.cog, expCog: [mx / expVol, 40, mz / expVol] }, 'hub-verify')
  await snapshot('07-iso')
  await snapshot('07-top', { view: 'top' })
  return { partId }
}
