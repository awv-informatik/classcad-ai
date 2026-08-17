// Mirror across XY plane (normal=[0,0,1] at origin)
// Z coords should negate, X/Y unchanged
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorXY' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxR = await api.v1.solid.box({
    id: eifId,
    length: 80,
    width: 40,
    height: 30,
    translation: [0, 0, 25],
  })
  const boxId = boxR.result

  function getBBox(graphic, bodyId) {
    if (!graphic?.containers) return null
    const c = graphic.containers.find(c => c.owner === bodyId) || graphic.containers[0]
    return c ? { min: c.properties.min, max: c.properties.max } : null
  }

  const bboxBefore = getBBox(boxR.graphic, boxId)
  console.log('[07] bbox before:', JSON.stringify(bboxBefore))

  await api.v1.solid.cylinder({ id: eifId, height: 10, diameter: 10 })
  await snapshot('before')

  // Mirror across XY plane (Z=0)
  const mirrorR = await api.v1.solid.mirror({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [0, 0, 1],
  })

  const bboxAfter = getBBox(mirrorR.graphic, boxId)
  console.log('[07] bbox after:', JSON.stringify(bboxAfter))
  console.log('[07] mirror result:', mirrorR.result, 'maxLevel:', mirrorR.maxLevel)

  filewrite({ before: bboxBefore, after: bboxAfter }, 'xy-mirror-comparison')

  await snapshot('after')
  return { partId, eifId, boxId }
}
