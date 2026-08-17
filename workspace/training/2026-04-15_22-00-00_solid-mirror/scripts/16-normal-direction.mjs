// Does flipping the normal direction matter?
// [1,0,0] vs [-1,0,0] should define the same plane, so same result
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NormalDir' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  function getBBox(graphic, bodyId) {
    if (!graphic?.containers) return null
    const c = graphic.containers.find(c => c.owner === bodyId) || graphic.containers[0]
    return c ? { min: c.properties.min, max: c.properties.max } : null
  }

  // Test 1: mirror with [1,0,0]
  const b1R = await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 30, translation: [20, 10, 0] })
  const b1 = b1R.result

  const r1 = await api.v1.solid.mirror({
    id: eifId, target: b1,
    originPos: [0, 0, 0], normal: [1, 0, 0],
  })
  const bbox1 = getBBox(r1.graphic, b1)
  console.log('[16] bbox after [1,0,0]:', JSON.stringify(bbox1))

  // Restore by mirroring again
  await api.v1.solid.mirror({
    id: eifId, target: b1,
    originPos: [0, 0, 0], normal: [1, 0, 0],
  })

  // Test 2: mirror with [-1,0,0] (same plane, opposite normal)
  const r2 = await api.v1.solid.mirror({
    id: eifId, target: b1,
    originPos: [0, 0, 0], normal: [-1, 0, 0],
  })
  const bbox2 = getBBox(r2.graphic, b1)
  console.log('[16] bbox after [-1,0,0]:', JSON.stringify(bbox2))

  const sameResult = JSON.stringify(bbox1) === JSON.stringify(bbox2)
  console.log('[16] same result:', sameResult)

  filewrite({ normalPositive: bbox1, normalNegative: bbox2, sameResult }, 'normal-direction')

  return { partId, eifId }
}
