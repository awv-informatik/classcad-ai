export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CapTest' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  async function makeRegion(x, w, h) {
    const sk = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
    const lines = (await api.v1.sketch.rectangle({ id: sk, startPos: [x, 0, 0], endPos: [x + w, h, 0] })).result
    return (await api.v1.sketch.sketchRegion({ id: sk, geomIds: lines })).result
  }

  // capEnds: 1 (TRUE) — solid body (default behavior)
  const r1 = await makeRegion(0, 50, 40)
  const e1 = await api.v1.part.extrusion({ id: partId, name: 'Solid', references: [r1], limit2: 50, capEnds: 1 })
  console.log('[05] capEnds 1 (TRUE):', e1.result, 'maxLevel:', e1.maxLevel)
  if (e1.messages?.length) console.log('[05] msg:', e1.messages[0].message)

  // capEnds: 0 (FALSE) — sheet body
  const r2 = await makeRegion(70, 50, 40)
  const e2 = await api.v1.part.extrusion({ id: partId, name: 'Sheet', references: [r2], limit2: 50, capEnds: 0 })
  console.log('[05] capEnds 0 (FALSE):', e2.result, 'maxLevel:', e2.maxLevel)
  if (e2.messages?.length) console.log('[05] msg:', e2.messages[0].message)

  filewrite({
    capped: { result: e1.result, maxLevel: e1.maxLevel, messages: e1.messages },
    sheet: { result: e2.result, maxLevel: e2.maxLevel, messages: e2.messages },
  }, 'capEnds-results')

  await snapshot('capEnds-comparison')
  return { partId }
}
