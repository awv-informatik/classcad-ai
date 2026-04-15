// Mirror a sphere — center should shift, shape unchanged
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorSphere' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const sphR = await api.v1.solid.sphere({ id: eifId, radius: 20, translation: [40, 0, 0] })
  const sphId = sphR.result

  function getBBox(graphic, bodyId) {
    if (!graphic?.containers) return null
    const c = graphic.containers.find(c => c.owner === bodyId) || graphic.containers[0]
    return c ? { min: c.properties.min, max: c.properties.max } : null
  }

  const bboxBefore = getBBox(sphR.graphic, sphId)
  console.log('[18] sphere bbox before:', JSON.stringify(bboxBefore))

  await api.v1.solid.box({ id: eifId, length: 8, width: 8, height: 8 })
  await snapshot('before')

  const mirrorR = await api.v1.solid.mirror({
    id: eifId, target: sphId,
    originPos: [0, 0, 0], normal: [1, 0, 0],
  })

  const bboxAfter = getBBox(mirrorR.graphic, sphId)
  console.log('[18] sphere bbox after:', JSON.stringify(bboxAfter))
  console.log('[18] mirror result:', mirrorR.result, 'maxLevel:', mirrorR.maxLevel)

  // Sphere at X=40 → mirrored to X=-40. Bbox should be symmetric about X.
  filewrite({ before: bboxBefore, after: bboxAfter }, 'sphere-mirror')

  await snapshot('after')
  return { partId, eifId, sphId }
}
