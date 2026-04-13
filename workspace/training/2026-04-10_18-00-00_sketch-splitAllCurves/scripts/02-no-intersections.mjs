// 02 — Two non-intersecting lines. What does splitAllCurves return?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitNoIntersect' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 30, 0], endPos: [50, 30, 0] })).result
  console.log('[02] line1:', line1, 'line2:', line2)

  const r = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[02] result:', JSON.stringify(r.result))
  console.log('[02] maxLevel:', r.maxLevel)
  console.log('[02] result length:', r.result?.length)

  filewrite({ result: r.result, maxLevel: r.maxLevel, line1, line2 }, 'no-intersect-response')
  filewrite(r.structure, 'no-intersect-structure')

  await snapshot('no-intersect')
  return { partId }
}
