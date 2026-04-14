// Test: named constraints — does name appear in structure?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'NamedTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  const lineId = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 30, 0] })).result

  // Named constraint
  const cr = await api.v1.sketch.constraint({ id: skId, name: 'MyHoriz', type: 'HORIZONTAL', geomIds: [lineId] })
  console.log('[20] result:', cr.result, 'maxLevel:', cr.maxLevel)

  // Check structure for the constraint name
  const constraintNode = cr.structure?.tree?.[cr.result]
  console.log('[20] constraint node:', JSON.stringify(constraintNode))

  // Also check unnamed
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [0, 30, 0], endPos: [40, 50, 0] })).result
  const cr2 = await api.v1.sketch.constraint({ id: skId, type: 'VERTICAL', geomIds: [l2] })
  const node2 = cr2.structure?.tree?.[cr2.result]
  console.log('[20] unnamed node:', JSON.stringify(node2))

  await snapshot('result')

  filewrite({
    named: { id: cr.result, node: constraintNode },
    unnamed: { id: cr2.result, node: node2 },
  }, 'named-constraint-data')

  return { partId }
}
