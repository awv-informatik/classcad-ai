// Mirror across XZ plane (normal=[0,1,0] at origin)
// Y coords should negate, X/Z unchanged
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorXZ' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxR = await api.v1.solid.box({
    id: eifId,
    length: 80,
    width: 40,
    height: 30,
    translation: [20, 30, 0],
  })
  const boxId = boxR.result

  function getBBox(graphic, bodyId) {
    if (!graphic?.containers) return null
    const c = graphic.containers.find(c => c.owner === bodyId) || graphic.containers[0]
    return c ? { min: c.properties.min, max: c.properties.max } : null
  }

  const bboxBefore = getBBox(boxR.graphic, boxId)
  console.log('[06] bbox before:', JSON.stringify(bboxBefore))

  // Reference body
  await api.v1.solid.cylinder({ id: eifId, height: 60, diameter: 10 })
  await snapshot('before')

  // Mirror across XZ plane (Y=0)
  const mirrorR = await api.v1.solid.mirror({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [0, 1, 0],
  })

  const bboxAfter = getBBox(mirrorR.graphic, boxId)
  console.log('[06] bbox after:', JSON.stringify(bboxAfter))
  console.log('[06] mirror result:', mirrorR.result, 'maxLevel:', mirrorR.maxLevel)

  filewrite({ before: bboxBefore, after: bboxAfter }, 'xz-mirror-comparison')

  await snapshot('after')
  return { partId, eifId, boxId }
}
