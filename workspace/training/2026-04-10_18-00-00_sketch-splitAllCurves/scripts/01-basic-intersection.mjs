// 01 — Basic: circle + line intersection, observe split result
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitBasic' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Draw intersecting geometry: circle + horizontal line through center
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  const line = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result
  console.log('[01] circle ID:', circle, 'line ID:', line)

  await snapshot('before-split')

  // Split all curves at intersections
  const r = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[01] splitAllCurves result:', JSON.stringify(r.result))
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  console.log('[01] result length:', r.result?.length)

  // Dump full result and structure
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'split-response')
  filewrite(r.structure, 'split-structure')

  await snapshot('after-split')

  return { partId, circle, line, splitResult: r.result }
}
