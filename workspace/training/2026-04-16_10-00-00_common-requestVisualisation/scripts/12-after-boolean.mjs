// Test requestVisualisation after boolean operations
// Does the target solid's vis data change after a boolean?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VisBool' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const box1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 50, translation: [30, 10, -10] })).result
  console.log('[12] box1:', box1, 'box2:', box2)

  // Vis before boolean
  const rBefore = await api.v1.common.requestVisualisation({ ids: [box1] })
  const before = {
    meshCount: rBefore.graphic.containers[0].meshes.length,
    edgeCount: rBefore.graphic.containers[0].edges.length,
    vertexCount: rBefore.graphic.containers[0].vertices.length,
    min: rBefore.graphic.containers[0].properties.min,
    max: rBefore.graphic.containers[0].properties.max,
  }
  console.log('[12] before union:', JSON.stringify(before))

  // Union
  await api.v1.solid.union({ id: eifId, target: box1, tools: [box2] })

  // Vis after boolean
  const rAfter = await api.v1.common.requestVisualisation({ ids: [box1] })
  const after = {
    meshCount: rAfter.graphic.containers[0].meshes.length,
    edgeCount: rAfter.graphic.containers[0].edges.length,
    vertexCount: rAfter.graphic.containers[0].vertices.length,
    min: rAfter.graphic.containers[0].properties.min,
    max: rAfter.graphic.containers[0].properties.max,
  }
  console.log('[12] after union:', JSON.stringify(after))

  filewrite({ before, after }, 'boolean-vis-comparison')

  // Can we still request vis for the consumed tool (box2)?
  const rConsumed = await api.v1.common.requestVisualisation({ ids: [box2] })
  console.log('[12] consumed tool (box2): graphic?', !!rConsumed.graphic, 'maxLevel:', rConsumed.maxLevel)
  if (rConsumed.messages.length > 0) {
    console.log('[12] consumed tool messages:', JSON.stringify(rConsumed.messages))
  }

  await snapshot('after-boolean')
  return { partId }
}
