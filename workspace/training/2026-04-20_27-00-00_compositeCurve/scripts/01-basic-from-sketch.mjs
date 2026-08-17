export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CompCurveTest' })).result

  // Create a sketch with multiple lines forming an L-shape path
  const skId = (await api.v1.part.sketch({ id: partId, name: 'PathSketch' })).result
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [50, 0, 0], endPos: [50, 40, 0] })).result

  console.log('[01] partId:', partId, 'skId:', skId)
  console.log('[01] line1:', line1, 'line2:', line2)

  // Create composite curve from sketch curve IDs
  const r = await api.v1.part.compositeCurve({ id: partId, name: 'CC1', references: [line1, line2] })
  console.log('[01] compositeCurve result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  if (r.messages && r.messages.length > 0) {
    console.log('[01] messages:', JSON.stringify(r.messages))
  }

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'cc-response')

  await snapshot('composite-from-sketch')
  return { partId, skId, line1, line2, ccId: r.result }
}
