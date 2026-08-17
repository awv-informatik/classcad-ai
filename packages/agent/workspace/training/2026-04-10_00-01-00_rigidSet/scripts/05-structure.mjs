// 05 — Inspect structure tree to understand rigid set representation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StructureTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a triangle
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [60, 0, 0], endPos: [30, 40, 0] })).result
  const l3 = (await api.v1.sketch.line({ id: skId, startPos: [30, 40, 0], endPos: [0, 0, 0] })).result

  // Create rigid set
  const rs = await api.v1.sketch.rigidSet({ id: skId, geomIds: [l1, l2, l3] })
  console.log('[05] rigidSet result:', rs.result, 'maxLevel:', rs.maxLevel)

  // Dump structure to see how rigid set appears
  filewrite(rs.structure, 'structure')

  await snapshot('triangle-rigidset')
  return { partId }
}
