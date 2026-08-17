// Test with unnormalized normal vector — does it auto-normalize?
// [5, 0, 0] should behave same as [1, 0, 0]
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UnnormNormal' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxR = await api.v1.solid.box({
    id: eifId,
    length: 80,
    width: 40,
    height: 30,
    translation: [20, 10, 0],
  })
  const boxId = boxR.result

  function getBBox(graphic, bodyId) {
    if (!graphic?.containers) return null
    const c = graphic.containers.find(c => c.owner === bodyId) || graphic.containers[0]
    return c ? { min: c.properties.min, max: c.properties.max } : null
  }

  const bboxBefore = getBBox(boxR.graphic, boxId)
  console.log('[15] bbox before:', JSON.stringify(bboxBefore))

  // Mirror with unnormalized normal [5, 0, 0]
  const mirrorR = await api.v1.solid.mirror({
    id: eifId, target: boxId,
    originPos: [0, 0, 0], normal: [5, 0, 0],
  })

  const bboxAfter = getBBox(mirrorR.graphic, boxId)
  console.log('[15] bbox after unnormalized:', JSON.stringify(bboxAfter))
  console.log('[15] mirror result:', mirrorR.result, 'maxLevel:', mirrorR.maxLevel)

  // Expected same result as [1,0,0]: X negated
  filewrite({ before: bboxBefore, after: bboxAfter }, 'unnormalized-normal')

  return { partId, eifId, boxId }
}
