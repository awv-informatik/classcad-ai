// Verify mirror by comparing bounding boxes before and after
// Mirror across YZ plane (normal=[1,0,0]) at origin
// Box at [20,10,0] with size 80x40x30 → X coords should negate
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorBBox' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create asymmetric box
  const boxR = await api.v1.solid.box({
    id: eifId,
    length: 80,
    width: 40,
    height: 30,
    translation: [20, 10, 0],
  })
  const boxId = boxR.result

  // Extract bounding box from graphic container
  function getBBox(graphic, bodyId) {
    if (!graphic?.containers) return null
    const c = graphic.containers.find(c => c.owner === bodyId) || graphic.containers[0]
    return c ? { min: c.properties.min, max: c.properties.max } : null
  }

  const bboxBefore = getBBox(boxR.graphic, boxId)
  console.log('[05] bbox before:', JSON.stringify(bboxBefore))

  // Add reference cylinder at origin (won't be mirrored)
  const refR = await api.v1.solid.cylinder({ id: eifId, height: 60, diameter: 10 })
  const refId = refR.result

  await snapshot('before')

  // Mirror box across YZ plane
  const mirrorR = await api.v1.solid.mirror({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [1, 0, 0],
  })

  const bboxAfter = getBBox(mirrorR.graphic, boxId)
  console.log('[05] bbox after:', JSON.stringify(bboxAfter))
  console.log('[05] mirror result:', mirrorR.result, 'maxLevel:', mirrorR.maxLevel)

  // Expected: X coords negated → min.x=-60, max.x=20 (was min.x=-20, max.x=60)
  // Y and Z unchanged
  filewrite({
    before: bboxBefore,
    after: bboxAfter,
    resultId: mirrorR.result,
    maxLevel: mirrorR.maxLevel,
    messages: mirrorR.messages,
  }, 'mirror-bbox-comparison')

  await snapshot('after')

  return { partId, eifId, boxId }
}
