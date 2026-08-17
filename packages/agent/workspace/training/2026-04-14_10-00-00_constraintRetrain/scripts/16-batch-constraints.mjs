// Test: batch creation — pass array of constraint params
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'BatchTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Create a rectangle
  const rectIds = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0] })).result
  console.log('[16] rectIds:', rectIds)

  // Batch-create multiple constraints at once
  const cr = await api.v1.sketch.constraint([
    { id: skId, type: 'HORIZONTAL', geomIds: [rectIds[0]] },
    { id: skId, type: 'VERTICAL', geomIds: [rectIds[1]] },
    { id: skId, name: 'myConstraint', type: 'EQUAL_LENGTH', geomIds: [rectIds[0], rectIds[2]] },
  ])
  console.log('[16] batch result:', JSON.stringify(cr.result))
  console.log('[16] maxLevel:', cr.maxLevel)
  if (cr.messages?.length) console.log('[16] messages:', JSON.stringify(cr.messages))

  await snapshot('result')

  filewrite({ rectIds, batchResult: cr.result, maxLevel: cr.maxLevel, messages: cr.messages }, 'batch-data')

  return { partId }
}
