// Mirror a compound solid (result of boolean union)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorCompound' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create an L-shape by unioning two boxes
  const b1R = await api.v1.solid.box({ id: eifId, length: 80, width: 20, height: 20 })
  const b1 = b1R.result
  const b2 = (await api.v1.solid.box({ id: eifId, length: 20, width: 60, height: 20 })).result
  await api.v1.solid.union({ id: eifId, target: b1, tools: [b2] })

  // Translate the L-shape to +X
  await api.v1.solid.translation({ id: eifId, target: b1, translation: [50, 0, 0] })

  function getBBox(graphic, bodyId) {
    if (!graphic?.containers) return null
    const c = graphic.containers.find(c => c.owner === bodyId) || graphic.containers[0]
    return c ? { min: c.properties.min, max: c.properties.max } : null
  }

  // Get bbox via a neutral call
  const checkR = await api.v1.solid.cylinder({ id: eifId, height: 10, diameter: 6 })
  const bboxBefore = getBBox(checkR.graphic, b1)
  console.log('[12] compound bbox before:', JSON.stringify(bboxBefore))

  await snapshot('before')

  // Mirror compound across YZ plane
  const mirrorR = await api.v1.solid.mirror({
    id: eifId, target: b1,
    originPos: [0, 0, 0], normal: [1, 0, 0],
  })

  const bboxAfter = getBBox(mirrorR.graphic, b1)
  console.log('[12] compound bbox after:', JSON.stringify(bboxAfter))
  console.log('[12] mirror result:', mirrorR.result, 'maxLevel:', mirrorR.maxLevel)

  filewrite({ before: bboxBefore, after: bboxAfter }, 'compound-mirror')

  await snapshot('after')
  return { partId, eifId, compoundId: b1 }
}
