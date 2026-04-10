// Isolated test: zero yDistance with yCount > 1
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ZeroYDistIsolated' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  console.log('[07] partId:', partId, 'skId:', skId)

  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [10, 10, 0] })).result
  console.log('[07] line:', l1)

  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1] })).result
  console.log('[07] rigidSet:', rsId)

  const r = await api.v1.sketch.linearPattern({
    id: skId,
    rigidSetId: rsId,
    yCount: 3,
    yDistance: 0,
  })
  console.log('[07] maxLevel:', r.maxLevel)
  console.log('[07] result:', r.result)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'zero-ydist-isolated')

  if (r.maxLevel <= 31) {
    await snapshot('zero-ydist')
  }

  return { partId }
}
