export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NonContigTest' })).result

  // Create sketch with two separate (non-contiguous) lines
  const skId = (await api.v1.part.sketch({ id: partId, name: 'GapSketch' })).result
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [30, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [50, 20, 0], endPos: [80, 20, 0] })).result

  console.log('[03] partId:', partId, 'skId:', skId)
  console.log('[03] line1:', line1, 'line2:', line2, '(gap between them)')

  // Try composite curve from non-contiguous curves
  const r = await api.v1.part.compositeCurve({ id: partId, name: 'CC_Gap', references: [line1, line2] })
  console.log('[03] compositeCurve result:', r.result)
  console.log('[03] maxLevel:', r.maxLevel)
  if (r.messages && r.messages.length > 0) {
    console.log('[03] messages:', JSON.stringify(r.messages))
  }

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'cc-gap-response')

  await snapshot('non-contiguous')
  return { partId, ccId: r.result }
}
