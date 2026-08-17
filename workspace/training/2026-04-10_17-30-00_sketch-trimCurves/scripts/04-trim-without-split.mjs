// 04: Can you call trimCurves without splitAllCurves first?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TrimNoSplit' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Draw two intersecting lines
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, -50, 0], endPos: [0, 50, 0] })).result
  console.log('[04] line1:', line1, 'line2:', line2)

  // Try trimming without splitting first — pass the original line ID
  const trimRes = await api.v1.sketch.trimCurves({ id: skId, curveIds: [line1] })
  console.log('[04] trimCurves on unsplit line result:', JSON.stringify(trimRes.result))
  console.log('[04] trimCurves maxLevel:', trimRes.maxLevel)
  console.log('[04] trimCurves messages:', JSON.stringify(trimRes.messages))
  filewrite({ result: trimRes.result, messages: trimRes.messages, maxLevel: trimRes.maxLevel }, 'trim-no-split')

  await snapshot('after-trim-no-split')
  return { partId }
}
