// Test: verify scale numerically via graphic data
// Scale a box at origin by 2x, dump graphic before/after to compare vertex positions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleVertexTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Single box: 40x30x20 at origin
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result

  // Get graphic before scale
  const beforeResp = await api.v1.solid.scale({ id: eifId, target: boxId, factor: 1 })
  filewrite(beforeResp.graphic, 'graphic-before')

  // Now scale 2x
  const afterResp = await api.v1.solid.scale({ id: eifId, target: boxId, factor: 2 })
  filewrite(afterResp.graphic, 'graphic-after')

  // Also dump structure for comparison
  filewrite(beforeResp.structure, 'structure-before')
  filewrite(afterResp.structure, 'structure-after')

  console.log('[13] before graphic bodies:', beforeResp.graphic ? Object.keys(beforeResp.graphic).length : 'null')
  console.log('[13] after graphic bodies:', afterResp.graphic ? Object.keys(afterResp.graphic).length : 'null')

  await snapshot('after-scale-2x-vertex-check')

  return { partId, eifId, boxId }
}
