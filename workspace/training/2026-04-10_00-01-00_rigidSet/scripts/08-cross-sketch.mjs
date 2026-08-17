// 08 — What happens passing geometry from a different sketch?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CrossSketch' })).result
  const sk1 = (await api.v1.sketch.create({ id: partId })).result
  const sk2 = (await api.v1.sketch.create({ id: partId })).result

  // Create line in sketch 1
  const lineInSk1 = (await api.v1.sketch.line({ id: sk1, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  console.log('[08] line in sketch1:', lineInSk1)

  // Try to create rigid set in sketch 2 using geometry from sketch 1
  const r = await api.v1.sketch.rigidSet({ id: sk2, geomIds: [lineInSk1] })
  console.log('[08] cross-sketch rigidSet — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'cross-sketch')

  return { partId }
}
