// Mirror across diagonal plane — normal=[1,1,0] (normalized) at origin
// Tests non-axis-aligned planes
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorDiag' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Asymmetric box offset in X only
  const boxR = await api.v1.solid.box({
    id: eifId,
    length: 60,
    width: 30,
    height: 20,
    translation: [40, 0, 0],
  })
  const boxId = boxR.result

  function getBBox(graphic, bodyId) {
    if (!graphic?.containers) return null
    const c = graphic.containers.find(c => c.owner === bodyId) || graphic.containers[0]
    return c ? { min: c.properties.min, max: c.properties.max } : null
  }

  const bboxBefore = getBBox(boxR.graphic, boxId)
  console.log('[09] bbox before:', JSON.stringify(bboxBefore))

  await api.v1.solid.cylinder({ id: eifId, height: 60, diameter: 8 })
  await snapshot('before')

  // Mirror across 45° diagonal plane (X=Y swaps)
  // Normal [1,1,0] defines a plane at 45° between X and Y axes
  const mirrorR = await api.v1.solid.mirror({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [1, 1, 0],
  })

  const bboxAfter = getBBox(mirrorR.graphic, boxId)
  console.log('[09] bbox after:', JSON.stringify(bboxAfter))
  console.log('[09] mirror result:', mirrorR.result, 'maxLevel:', mirrorR.maxLevel)

  // For a reflection across the plane with normal [1,1,0] (normalized [1/√2, 1/√2, 0]):
  // Point (x,y,z) → (y,x,z) — X and Y swap!
  // Box was at X: [10, 70], Y: [-15, 15]. After: X: [-15, 15], Y: [10, 70]
  filewrite({ before: bboxBefore, after: bboxAfter }, 'diagonal-mirror-comparison')

  await snapshot('after')
  return { partId, eifId, boxId }
}
