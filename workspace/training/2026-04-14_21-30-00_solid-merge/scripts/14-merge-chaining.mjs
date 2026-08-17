// 14 — Chain multiple merge calls on the same target.
// Merge box2 into box1, then merge box3 into box1.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Chain' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 50, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 60, translation: [60, 10, 0] })).result
  const box3 = (await api.v1.solid.box({ id: eifId, length: 30, width: 60, height: 40, translation: [-20, -10, 0] })).result

  // First merge
  const r1 = await api.v1.solid.merge({ id: eifId, target: box1, tools: [box2] })
  console.log('[14] merge1 result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Second merge — target is the same box1 ID
  const r2 = await api.v1.solid.merge({ id: eifId, target: box1, tools: [box3] })
  console.log('[14] merge2 result:', r2.result, 'maxLevel:', r2.maxLevel)

  if (r2.graphic && r2.graphic.containers) {
    for (const c of r2.graphic.containers) {
      console.log('[14] container', c.id, ': meshes=', c.meshes?.length, 'edges=', c.edges?.length)
    }
  }

  await snapshot('chained')

  return { partId }
}
