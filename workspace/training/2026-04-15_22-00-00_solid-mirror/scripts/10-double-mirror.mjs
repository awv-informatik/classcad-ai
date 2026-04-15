// Double mirror — should return to original position
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DoubleMirror' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxR = await api.v1.solid.box({
    id: eifId,
    length: 80,
    width: 40,
    height: 30,
    translation: [20, 10, 5],
  })
  const boxId = boxR.result

  function getBBox(graphic, bodyId) {
    if (!graphic?.containers) return null
    const c = graphic.containers.find(c => c.owner === bodyId) || graphic.containers[0]
    return c ? { min: c.properties.min, max: c.properties.max } : null
  }

  const bboxOriginal = getBBox(boxR.graphic, boxId)
  console.log('[10] bbox original:', JSON.stringify(bboxOriginal))

  // First mirror
  const r1 = await api.v1.solid.mirror({
    id: eifId, target: boxId,
    originPos: [0, 0, 0], normal: [1, 0, 0],
  })
  const bboxAfter1 = getBBox(r1.graphic, boxId)
  console.log('[10] bbox after 1st mirror:', JSON.stringify(bboxAfter1))

  // Second mirror (same plane — should restore)
  const r2 = await api.v1.solid.mirror({
    id: eifId, target: boxId,
    originPos: [0, 0, 0], normal: [1, 0, 0],
  })
  const bboxAfter2 = getBBox(r2.graphic, boxId)
  console.log('[10] bbox after 2nd mirror:', JSON.stringify(bboxAfter2))

  // Check if original === after 2nd mirror
  const restored = JSON.stringify(bboxOriginal) === JSON.stringify(bboxAfter2)
  console.log('[10] restored to original:', restored)

  filewrite({ original: bboxOriginal, after1: bboxAfter1, after2: bboxAfter2, restored }, 'double-mirror')

  return { partId, eifId, boxId, restored }
}
