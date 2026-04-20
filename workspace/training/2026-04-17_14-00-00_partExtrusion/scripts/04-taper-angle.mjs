export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TaperTest' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  async function makeRegion(x, w, h) {
    const sk = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
    const lines = (await api.v1.sketch.rectangle({ id: sk, startPos: [x, 0, 0], endPos: [x + w, h, 0] })).result
    return (await api.v1.sketch.sketchRegion({ id: sk, geomIds: lines })).result
  }

  // No taper (reference)
  const r1 = await makeRegion(0, 50, 50)
  const e1 = await api.v1.part.extrusion({ id: partId, name: 'NoTaper', references: [r1], limit2: 60 })
  console.log('[04] no taper:', e1.result, 'maxLevel:', e1.maxLevel)

  // Positive taper angle: 10 degrees = ~0.1745 radians
  const r2 = await makeRegion(70, 50, 50)
  const e2 = await api.v1.part.extrusion({ id: partId, name: 'Taper10', references: [r2], limit2: 60, taperAngle: 0.1745 })
  console.log('[04] taper 10°:', e2.result, 'maxLevel:', e2.maxLevel)

  // Larger taper angle: 30 degrees = ~0.5236 radians
  const r3 = await makeRegion(140, 50, 50)
  const e3 = await api.v1.part.extrusion({ id: partId, name: 'Taper30', references: [r3], limit2: 60, taperAngle: 0.5236 })
  console.log('[04] taper 30°:', e3.result, 'maxLevel:', e3.maxLevel)

  // Negative taper angle: -10 degrees
  const r4 = await makeRegion(210, 50, 50)
  const e4 = await api.v1.part.extrusion({ id: partId, name: 'TaperNeg', references: [r4], limit2: 60, taperAngle: -0.1745 })
  console.log('[04] taper -10°:', e4.result, 'maxLevel:', e4.maxLevel)

  filewrite({
    noTaper: { result: e1.result, maxLevel: e1.maxLevel, messages: e1.messages },
    taper10: { result: e2.result, maxLevel: e2.maxLevel, messages: e2.messages },
    taper30: { result: e3.result, maxLevel: e3.maxLevel, messages: e3.messages },
    taperNeg: { result: e4.result, maxLevel: e4.maxLevel, messages: e4.messages },
  }, 'taper-results')

  await snapshot('taper-comparison')
  return { partId }
}
