// Mirror at offset plane — originPos=[50,0,0], normal=[1,0,0]
// This mirrors across a plane at X=50 (not origin)
// A box centered at origin should end up at X=100
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorOffset' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Box at origin, length=40 centered → X from -20 to 20
  const boxR = await api.v1.solid.box({
    id: eifId,
    length: 40,
    width: 30,
    height: 20,
  })
  const boxId = boxR.result

  function getBBox(graphic, bodyId) {
    if (!graphic?.containers) return null
    const c = graphic.containers.find(c => c.owner === bodyId) || graphic.containers[0]
    return c ? { min: c.properties.min, max: c.properties.max } : null
  }

  const bboxBefore = getBBox(boxR.graphic, boxId)
  console.log('[08] bbox before:', JSON.stringify(bboxBefore))
  // Expect: min=[-20,-15,-10], max=[20,15,10]

  await api.v1.solid.cylinder({ id: eifId, height: 60, diameter: 8 })
  await snapshot('before')

  // Mirror across plane at X=50
  const mirrorR = await api.v1.solid.mirror({
    id: eifId,
    target: boxId,
    originPos: [50, 0, 0],
    normal: [1, 0, 0],
  })

  const bboxAfter = getBBox(mirrorR.graphic, boxId)
  console.log('[08] bbox after:', JSON.stringify(bboxAfter))
  // Expected: X reflected around X=50. Point at X=-20 → 50+(50-(-20)) = 120. X=20 → 50+(50-20) = 80.
  // So min.x=80, max.x=120
  console.log('[08] mirror result:', mirrorR.result, 'maxLevel:', mirrorR.maxLevel)

  filewrite({ before: bboxBefore, after: bboxAfter }, 'offset-mirror-comparison')

  await snapshot('after')
  return { partId, eifId, boxId }
}
