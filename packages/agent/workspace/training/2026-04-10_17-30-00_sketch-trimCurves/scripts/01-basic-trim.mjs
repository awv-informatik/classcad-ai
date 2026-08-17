// 01: Basic trimCurves — two intersecting lines, split, then trim one segment
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TrimTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Draw two intersecting lines (cross pattern)
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [-50, 0, 0], endPos: [50, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, -50, 0], endPos: [0, 50, 0] })).result
  console.log('[01] line1:', line1, 'line2:', line2)

  await snapshot('before-split')

  // Split all curves at intersections
  const splitRes = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[01] splitAllCurves result:', JSON.stringify(splitRes.result))
  console.log('[01] splitAllCurves maxLevel:', splitRes.maxLevel)
  console.log('[01] splitAllCurves messages:', JSON.stringify(splitRes.messages))
  filewrite({ result: splitRes.result, messages: splitRes.messages, maxLevel: splitRes.maxLevel }, 'split-response')

  await snapshot('after-split')

  // Try trimming the first curve in the result array
  if (Array.isArray(splitRes.result) && splitRes.result.length > 0) {
    const trimTarget = splitRes.result[0]
    console.log('[01] trimming curve:', trimTarget)

    const trimRes = await api.v1.sketch.trimCurves({ id: skId, curveIds: [trimTarget] })
    console.log('[01] trimCurves result:', JSON.stringify(trimRes.result))
    console.log('[01] trimCurves maxLevel:', trimRes.maxLevel)
    console.log('[01] trimCurves messages:', JSON.stringify(trimRes.messages))
    filewrite({ result: trimRes.result, messages: trimRes.messages, maxLevel: trimRes.maxLevel }, 'trim-response')

    await snapshot('after-trim')
  } else {
    console.log('[01] splitAllCurves did not return an array — cannot trim')
  }

  return { partId }
}
