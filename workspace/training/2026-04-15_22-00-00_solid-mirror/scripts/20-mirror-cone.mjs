// Mirror a cone — asymmetric shape, verify visual change
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorCone' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const coneR = await api.v1.solid.cone({
    id: eifId,
    height: 40,
    bDiameter: 30,
    tDiameter: 10,
    translation: [40, 0, 0],
  })
  const coneId = coneR.result

  function getBBox(graphic, bodyId) {
    if (!graphic?.containers) return null
    const c = graphic.containers.find(c => c.owner === bodyId) || graphic.containers[0]
    return c ? { min: c.properties.min, max: c.properties.max } : null
  }

  const bboxBefore = getBBox(coneR.graphic, coneId)
  console.log('[20] cone bbox before:', JSON.stringify(bboxBefore))

  await api.v1.solid.box({ id: eifId, length: 8, width: 8, height: 8 })
  await snapshot('before')

  const mirrorR = await api.v1.solid.mirror({
    id: eifId, target: coneId,
    originPos: [0, 0, 0], normal: [1, 0, 0],
  })

  const bboxAfter = getBBox(mirrorR.graphic, coneId)
  console.log('[20] cone bbox after:', JSON.stringify(bboxAfter))
  console.log('[20] mirror result:', mirrorR.result, 'maxLevel:', mirrorR.maxLevel)

  filewrite({ before: bboxBefore, after: bboxAfter }, 'cone-mirror')

  await snapshot('after')
  return { partId, eifId, coneId }
}
