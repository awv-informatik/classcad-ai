// 08: Split → trim → mergeBack: does the geometry change after merge?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TrimMerge' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Circle + horizontal line through it
  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  const line = (await api.v1.sketch.line({ id: skId, startPos: [-60, 0, 0], endPos: [60, 0, 0] })).result
  console.log('[08] circle:', circle, 'line:', line)

  await snapshot('before')

  // Split all
  const splitRes = await api.v1.sketch.splitAllCurves({ id: skId })
  const splitIds = splitRes.result
  console.log('[08] split IDs:', JSON.stringify(splitIds))
  // Expected: [Circle_part0(arc), Circle_part1(arc), Line_part0, Line_part1, Line_part2]

  // Trim the middle line segment (Line_part1, index 3) and upper arc (Circle_part0, index 0)
  // This should produce: bottom arc + left line + right line (typical CAD trim)
  console.log('[08] trimming Circle_part0 (id:', splitIds[0], ') and Line_part1 (id:', splitIds[3], ')')
  const trimRes = await api.v1.sketch.trimCurves({ id: skId, curveIds: [splitIds[0], splitIds[3]] })
  console.log('[08] trimCurves maxLevel:', trimRes.maxLevel)
  console.log('[08] trimCurves messages:', JSON.stringify(trimRes.messages))

  await snapshot('after-trim-before-merge')

  // Now merge back
  const mergeRes = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[08] mergeBack maxLevel:', mergeRes.maxLevel)
  console.log('[08] mergeBack messages:', JSON.stringify(mergeRes.messages))
  filewrite({ result: mergeRes.result, messages: mergeRes.messages, maxLevel: mergeRes.maxLevel }, 'merge-response')

  await snapshot('after-merge')

  // Check geometry after merge
  const geomAfter = await api.v1.sketch.getGeometry({ id: skId })
  filewrite(geomAfter.result, 'geom-after-merge')
  console.log('[08] geometry after merge:', JSON.stringify(geomAfter.result))

  return { partId }
}
