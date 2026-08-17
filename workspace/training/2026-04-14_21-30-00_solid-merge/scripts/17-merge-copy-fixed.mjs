// 17 — Copy a merged solid (using correct `target` param), translate, verify.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MergeCopyFixed' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 50, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 60, translation: [50, 10, 0] })).result

  const mergeR = await api.v1.solid.merge({ id: eifId, target: box1, tools: [box2] })
  console.log('[17] merge result:', mergeR.result, 'maxLevel:', mergeR.maxLevel)

  // Copy the merged solid using correct `target` param
  const copyR = await api.v1.solid.copy({ id: eifId, target: mergeR.result, translation: [0, 80, 0] })
  console.log('[17] copy result:', copyR.result, 'maxLevel:', copyR.maxLevel)

  if (copyR.graphic && copyR.graphic.containers) {
    console.log('[17] containers after copy:', copyR.graphic.containers.length)
    for (const c of copyR.graphic.containers) {
      console.log('[17]   container', c.id, ': meshes=', c.meshes?.length)
    }
  }

  await snapshot('merged-and-copy')

  return { partId }
}
