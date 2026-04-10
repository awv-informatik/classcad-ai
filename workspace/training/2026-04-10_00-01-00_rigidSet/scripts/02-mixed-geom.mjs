// 02 — rigidSet with mixed geometry types: line, arc, circle, point
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MixedGeom' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create various geometry types
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result
  const arc1 = (await api.v1.sketch.arcByCenter({ id: skId, centerPos: [60, 20, 0], startPos: [80, 20, 0], endPos: [60, 40, 0] })).result
  const circle1 = (await api.v1.sketch.circle({ id: skId, centerPos: [-30, 20, 0], radius: 15 })).result
  const pt1 = (await api.v1.sketch.point({ id: skId, pos: [20, 30, 0] })).result

  console.log('[02] line1:', line1, 'arc1:', arc1, 'circle1:', circle1, 'pt1:', pt1)

  // Test rigidSet with all types
  const r = await api.v1.sketch.rigidSet({ id: skId, geomIds: [line1, arc1, circle1, pt1] })
  console.log('[02] rigidSet all types — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'mixed-response')

  await snapshot('mixed')
  return { partId }
}
