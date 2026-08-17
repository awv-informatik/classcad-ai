export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SingleCurveTest' })).result

  // Single sketch curve
  const skId = (await api.v1.part.sketch({ id: partId, name: 'Sk1' })).result
  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 30, 0] })).result

  console.log('[05] lineId:', lineId)

  // Try composite curve with just one reference
  const r = await api.v1.part.compositeCurve({ id: partId, name: 'CC_Single', references: [lineId] })
  console.log('[05] compositeCurve result:', r.result)
  console.log('[05] maxLevel:', r.maxLevel)
  if (r.messages && r.messages.length > 0) {
    console.log('[05] messages:', JSON.stringify(r.messages))
  }

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'cc-single-response')

  await snapshot('single-curve')
  return { partId, ccId: r.result }
}
