export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LimitTest' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  async function makeRegion(x, w, h) {
    const sk = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
    const lines = (await api.v1.sketch.rectangle({ id: sk, startPos: [x, 0, 0], endPos: [x + w, h, 0] })).result
    return (await api.v1.sketch.sketchRegion({ id: sk, geomIds: lines })).result
  }

  // limit2=0
  const r1 = await makeRegion(0, 30, 30)
  const e1 = await api.v1.part.extrusion({ id: partId, name: 'Lim0', references: [r1], limit2: 0 })
  console.log('[06] limit2=0:', e1.result, 'maxLevel:', e1.maxLevel)
  if (e1.messages?.length) console.log('[06] limit2=0 msg:', e1.messages[0].message)

  // limit2 negative
  const r2 = await makeRegion(50, 30, 30)
  const e2 = await api.v1.part.extrusion({ id: partId, name: 'LimNeg', references: [r2], limit2: -20 })
  console.log('[06] limit2=-20:', e2.result, 'maxLevel:', e2.maxLevel)
  if (e2.messages?.length) console.log('[06] limit2=-20 msg:', e2.messages[0].message)

  // CUSTOM: limit1 > limit2 (inverted range)
  const r3 = await makeRegion(100, 30, 30)
  const e3 = await api.v1.part.extrusion({ id: partId, name: 'LimInv', references: [r3], type: 'CUSTOM', limit1: 30, limit2: 10, direction: [0, 0, 1] })
  console.log('[06] limit1>limit2:', e3.result, 'maxLevel:', e3.maxLevel)
  if (e3.messages?.length) console.log('[06] limit1>limit2 msg:', e3.messages[0].message)

  // Very small limit2
  const r4 = await makeRegion(150, 30, 30)
  const e4 = await api.v1.part.extrusion({ id: partId, name: 'LimTiny', references: [r4], limit2: 0.001 })
  console.log('[06] limit2=0.001:', e4.result, 'maxLevel:', e4.maxLevel)

  // limit2 omitted (should use default=100)
  const r5 = await makeRegion(200, 30, 30)
  const e5 = await api.v1.part.extrusion({ id: partId, name: 'LimDefault', references: [r5] })
  console.log('[06] limit2 omitted:', e5.result, 'maxLevel:', e5.maxLevel)

  filewrite({
    zero: { result: e1.result, maxLevel: e1.maxLevel, messages: e1.messages },
    negative: { result: e2.result, maxLevel: e2.maxLevel, messages: e2.messages },
    inverted: { result: e3.result, maxLevel: e3.maxLevel, messages: e3.messages },
    tiny: { result: e4.result, maxLevel: e4.maxLevel, messages: e4.messages },
    default: { result: e5.result, maxLevel: e5.maxLevel, messages: e5.messages },
  }, 'limit-results')

  await snapshot('limits')
  return { partId }
}
