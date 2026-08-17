// 16 — Copy a merged solid, then translate the copy. Verify merged solid is fully functional.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MergeCopy' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 50, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 60, translation: [50, 10, 0] })).result

  const mergeR = await api.v1.solid.merge({ id: eifId, target: box1, tools: [box2] })
  console.log('[16] merge result:', mergeR.result, 'maxLevel:', mergeR.maxLevel)

  // Copy the merged solid
  const copyR = await api.v1.solid.copy({ id: eifId, solid: mergeR.result })
  console.log('[16] copy result:', copyR.result, 'maxLevel:', copyR.maxLevel)

  // Translate the copy
  if (copyR.result) {
    const transR = await api.v1.solid.translation({ id: eifId, solid: copyR.result, vector: [0, 80, 0] })
    console.log('[16] translate copy result:', transR.result, 'maxLevel:', transR.maxLevel)
  }

  if (mergeR.graphic && mergeR.graphic.containers) {
    console.log('[16] containers after all ops:', mergeR.graphic.containers.length)
  }

  // Get final state
  const finalR = await api.v1.common.getClassFileVersion({})
  if (finalR.graphic && finalR.graphic.containers) {
    console.log('[16] final containers:', finalR.graphic.containers.length)
  }

  await snapshot('merged-and-copy')

  return { partId }
}
