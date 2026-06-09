// Boss: peanut = two R22.5 circles at (41,40),(79,40) + R10 waist fillets, z=35..45.
// 4 arcs direct-constructed with float-exact tangent points (ratio math, no rounded literals).
// Verify: analytic area + grid integration (independent) + server mass props.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LiquidMixerV2' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const noGenL = { genFixation: false, genIncidence: false, genVertAndHoriz: false }
  const noGenA = { genFixation: false, genIncidence: false }

  // --- block (as script 03) ---
  const sk1 = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'BlockProfile' })).result
  const lines = (await api.v1.sketch.line([
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
    id: partId, name: 'Block', references: [...lines, ...arcs1], type: 'UP', limit2: 35,
  })).result

  // --- peanut geometry (float-exact) ---
  const R = 22.5, RF = 10, D = 38
  const C1 = [41, 40], C2 = [79, 40]
  const fy = Math.sqrt((R + RF) ** 2 - (D / 2) ** 2)          // 26.3676 — fillet center offset
  const Ft = [60, 40 + fy], Fb = [60, 40 - fy]
  const k = R / (R + RF)                                       // 22.5/32.5 = 9/13
  const T1t = [41 + k * 19, 40 + k * fy], T2t = [79 - k * 19, 40 + k * fy]
  const T1b = [41 + k * 19, 40 - k * fy], T2b = [79 - k * 19, 40 - k * fy]
  console.log('[04] tangent pts:', JSON.stringify({ T1t, T2t, Ft }))

  // --- boss sketch on z=35 plane ---
  const wpR = await api.v1.part.workPlane({ id: partId, name: 'BossPlane', normal: [0, 0, 1], offset: 35 })
  console.log('[04] workplane:', wpR.result, 'maxLevel:', wpR.maxLevel)
  const sk2 = (await api.v1.sketch.create({ id: partId, planeId: wpR.result, name: 'BossProfile' })).result

  const z = 0
  const arcs2R = await api.v1.sketch.arcByCenter([
    // boss1 major arc: T1t -> (left around) -> T1b, CCW
    { id: sk2, startPos: [...T1t, z], centerPos: [...C1, z], endPos: [...T1b, z], isClockwise: false, ...noGenA },
    // bottom fillet: T1b -> T2b through top of fillet circle, CW
    { id: sk2, startPos: [...T1b, z], centerPos: [...Fb, z], endPos: [...T2b, z], isClockwise: true, ...noGenA },
    // boss2 major arc: T2b -> (right around) -> T2t, CCW
    { id: sk2, startPos: [...T2b, z], centerPos: [...C2, z], endPos: [...T2t, z], isClockwise: false, ...noGenA },
    // top fillet: T2t -> T1t through bottom of fillet circle, CW
    { id: sk2, startPos: [...T2t, z], centerPos: [...Ft, z], endPos: [...T1t, z], isClockwise: true, ...noGenA },
  ])
  console.log('[04] boss arcs:', JSON.stringify(arcs2R.result), 'maxLevel:', arcs2R.maxLevel, JSON.stringify(arcs2R.messages ?? []))

  const bossExt = (await api.v1.part.extrusion({
    id: partId, name: 'Boss', references: arcs2R.result, type: 'UP', limit2: 10,
  }))
  console.log('[04] boss extrusion:', bossExt.result, 'maxLevel:', bossExt.maxLevel, JSON.stringify(bossExt.messages ?? []))

  const unionR = await api.v1.part.boolean({ id: partId, type: 'UNION', name: 'Body', target: blockExt, tools: [bossExt.result] })
  console.log('[04] union:', unionR.result, 'maxLevel:', unionR.maxLevel)

  // --- expected values, two independent ways ---
  // (a) analytic: disc union + 2 fillet patches (triangle minus three segments)
  const lens = 2 * R * R * Math.acos(D / (2 * R)) - (D / 2) * Math.sqrt(4 * R * R - D * D)
  const discUnion = 2 * Math.PI * R * R - lens
  const X = [60, 40 + Math.sqrt(R * R - 19 * 19)]              // cusp point (top)
  const seg = (chord, r) => { const h = Math.asin(chord / 2 / r); return r * r * (h - Math.sin(h) * Math.cos(h)) }
  const triArea = 0.5 * (T2t[0] - T1t[0]) * (T1t[1] - X[1])
  const patch = triArea - seg(Math.hypot(T2t[0] - T1t[0], 0), RF) - 2 * seg(Math.hypot(X[0] - T1t[0], X[1] - T1t[1]), R)
  const peanutArea = discUnion + 2 * patch
  // (b) grid integration (0.01mm)
  const insidePeanut = (x, y) => {
    if ((x - 41) ** 2 + (y - 40) ** 2 <= R * R) return true
    if ((x - 79) ** 2 + (y - 40) ** 2 <= R * R) return true
    // fillet patches: inside fillet circle bounding region near waist
    if ((x - 60) ** 2 + (y - Ft[1]) ** 2 <= RF * RF || (x - 60) ** 2 + (y - Fb[1]) ** 2 <= RF * RF) return false
    // between the circles, outside both discs, outside fillet circles but inside the patch:
    return false
  }
  // patches need separate handling: point is in patch if outside both discs, INSIDE neither fillet circle… that's wrong.
  // correct: profile = (disc1 ∪ disc2 ∪ waistBand) where waistBand = points between tangent lines whose
  // fillet-circle distance >= RF (outside fillet circle) and |x-60| <= T2t[0]-60 and |y-40| <= k*fy…
  // Simpler exact predicate: inside iff inside a disc, OR (within the patch triangle region and outside fillet circles):
  const insideExact = (x, y) => {
    if ((x - 41) ** 2 + (y - 40) ** 2 <= R * R) return true
    if ((x - 79) ** 2 + (y - 40) ** 2 <= R * R) return true
    if (x >= T1t[0] && x <= T2t[0] && Math.abs(y - 40) <= k * fy + 1e-9) {
      const fc = y >= 40 ? Ft : Fb
      if ((x - 60) ** 2 + (y - fc[1]) ** 2 >= RF * RF) return true
    }
    return false
  }
  let cnt = 0, tot = 0
  const step = 0.02
  for (let x = 18; x <= 102; x += step) for (let y = 13; y <= 67; y += step) { tot++; if (insideExact(x, y)) cnt++ }
  const gridArea = cnt * step * step
  console.log('[04] peanut area analytic:', peanutArea.toFixed(3), 'grid:', gridArea.toFixed(3), 'delta%:', (100 * (gridArea - peanutArea) / peanutArea).toFixed(3))

  const blockVol = (9600 - 2 * (100 - 25 * Math.PI)) * 35
  const expVol = blockVol + peanutArea * 10
  const expCogZ = (blockVol * 17.5 + peanutArea * 10 * 40) / expVol
  const expCogX = (blockVol * 60.26141 + peanutArea * 10 * 60) / expVol

  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  console.log('[04] vol:', mp.volume.toFixed(2), 'expected:', expVol.toFixed(2), 'delta%:', (100 * (mp.volume - expVol) / expVol).toFixed(4))
  console.log('[04] COG:', JSON.stringify(mp.cog), `expected ~(${expCogX.toFixed(3)}, 40.000, ${expCogZ.toFixed(3)})`)

  filewrite({ vol: mp.volume, expVol, cog: mp.cog, expCogX, expCogZ, peanutArea, gridArea }, 'boss-verify')
  await snapshot('04-boss-iso')
  await snapshot('04-boss-top', { view: 'top' })
  return { partId }
}
