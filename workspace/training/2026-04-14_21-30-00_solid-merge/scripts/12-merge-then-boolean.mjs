// 12 — Can you perform boolean operations on a merged solid?
// Merge two boxes, then subtract a cylinder from the merged result.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MergeThenBool' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({ id: eifId, length: 100, width: 60, height: 40 })).result
  const box2 = (await api.v1.solid.box({
    id: eifId, length: 60, width: 40, height: 80, translation: [60, 30, 0]
  })).result

  // Merge first
  const mergeR = await api.v1.solid.merge({ id: eifId, target: box1, tools: [box2] })
  console.log('[12] merge result:', mergeR.result, 'maxLevel:', mergeR.maxLevel)

  await snapshot('after-merge')

  // Now subtract a cylinder from the merged solid
  const cyl = (await api.v1.solid.cylinder({ id: eifId, diameter: 30, height: 100, translation: [50, 30, -10] })).result
  console.log('[12] cylinder:', cyl)

  const subR = await api.v1.solid.subtraction({ id: eifId, target: mergeR.result, tools: [cyl] })
  console.log('[12] subtraction result:', subR.result, 'maxLevel:', subR.maxLevel)
  console.log('[12] sub msgs:', JSON.stringify(subR.messages))

  if (subR.graphic && subR.graphic.containers) {
    for (const c of subR.graphic.containers) {
      console.log('[12] container', c.id, ': meshes=', c.meshes?.length)
    }
  }

  await snapshot('after-subtract')

  return { partId }
}
