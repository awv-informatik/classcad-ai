// Mirror a cylinder — test with non-box solid type
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorCyl' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const cylR = await api.v1.solid.cylinder({
    id: eifId,
    height: 50,
    diameter: 30,
    translation: [40, 0, 0],
  })
  const cylId = cylR.result

  function getBBox(graphic, bodyId) {
    if (!graphic?.containers) return null
    const c = graphic.containers.find(c => c.owner === bodyId) || graphic.containers[0]
    return c ? { min: c.properties.min, max: c.properties.max } : null
  }

  const bboxBefore = getBBox(cylR.graphic, cylId)
  console.log('[11] bbox before:', JSON.stringify(bboxBefore))

  // Reference at origin
  await api.v1.solid.box({ id: eifId, length: 10, width: 10, height: 10 })
  await snapshot('before')

  const mirrorR = await api.v1.solid.mirror({
    id: eifId, target: cylId,
    originPos: [0, 0, 0], normal: [1, 0, 0],
  })

  const bboxAfter = getBBox(mirrorR.graphic, cylId)
  console.log('[11] bbox after:', JSON.stringify(bboxAfter))
  console.log('[11] mirror result:', mirrorR.result, 'maxLevel:', mirrorR.maxLevel)

  filewrite({ before: bboxBefore, after: bboxAfter }, 'cylinder-mirror')

  await snapshot('after')
  return { partId, eifId, cylId }
}
