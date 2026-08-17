// 18 — Can updateDimension be used on a geometric constraint (not a dimension)?
// E.g., passing a coincident constraint ID
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const p1 = (await api.v1.sketch.point({ id: skId, pos: [10, 20, 0] })).result
  const p2 = (await api.v1.sketch.point({ id: skId, pos: [30, 20, 0] })).result

  // Create a geometric constraint (coincident)
  const cId = (await api.v1.sketch.constraint({ id: skId, type: 'COINCIDENT', geomIds: [p1, p2] })).result
  console.log('[18] constraintId:', cId)

  // Try to updateDimension with a constraint ID
  const r = await api.v1.sketch.updateDimension({ id: cId, value: 50 })
  console.log('[18] constraint-update result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'constraint-update')

  return { partId }
}
