export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcCCTest' })).result

  const skId = (await api.v1.part.sketch({ id: partId, name: 'ArcSketch' })).result

  // Create line + arc + line (connected path)
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [30, 0, 0] })).result
  const arc = (await api.v1.sketch.arcBy3Points({ id: skId, startPos: [30, 0, 0], midPos: [40, 10, 0], endPos: [30, 20, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [30, 20, 0], endPos: [0, 20, 0] })).result

  console.log('[09] l1:', l1, 'arc:', arc, 'l2:', l2)

  const r = await api.v1.part.compositeCurve({ id: partId, name: 'CC_Arc', references: [l1, arc, l2] })
  console.log('[09] compositeCurve result:', r.result)
  console.log('[09] maxLevel:', r.maxLevel)
  if (r.messages && r.messages.length > 0) {
    console.log('[09] messages:', JSON.stringify(r.messages))
  }

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'cc-arc-response')

  await snapshot('line-arc-line')
  return { partId, ccId: r.result }
}
