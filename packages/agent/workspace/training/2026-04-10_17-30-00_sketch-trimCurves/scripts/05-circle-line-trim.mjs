// 05: trimCurves with circle + line intersection
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TrimCircleLine' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Circle at origin, line through it
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  const line = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result
  console.log('[05] circle:', circle, 'line:', line)

  await snapshot('before-split')

  // Split all
  const splitRes = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[05] splitAllCurves result:', JSON.stringify(splitRes.result))
  filewrite({ result: splitRes.result, messages: splitRes.messages, maxLevel: splitRes.maxLevel }, 'split-response')

  await snapshot('after-split')

  // Trim the first segment (should be part of circle or line)
  if (Array.isArray(splitRes.result) && splitRes.result.length > 0) {
    // Let's check what each ID is in the structure
    for (const id of splitRes.result) {
      // Find the name in the structure tree
      const key = String(id)
      if (splitRes.structure && splitRes.structure[key]) {
        console.log('[05] split id', id, 'name:', splitRes.structure[key].name, 'class:', splitRes.structure[key].class)
      }
    }

    // Trim the first two segments
    const trimRes = await api.v1.sketch.trimCurves({ id: skId, curveIds: [splitRes.result[0]] })
    console.log('[05] trimCurves first segment maxLevel:', trimRes.maxLevel)
    filewrite({ result: trimRes.result, messages: trimRes.messages, maxLevel: trimRes.maxLevel }, 'trim-response')

    await snapshot('after-trim-one')

    // Trim another segment
    if (splitRes.result.length > 1) {
      const trimRes2 = await api.v1.sketch.trimCurves({ id: skId, curveIds: [splitRes.result[1]] })
      console.log('[05] trimCurves second segment maxLevel:', trimRes2.maxLevel)
      await snapshot('after-trim-two')
    }
  }

  return { partId }
}
