// Mirror + translate combo — verify transforms chain correctly
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorTranslate' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxR = await api.v1.solid.box({ id: eifId, length: 60, width: 30, height: 20, translation: [40, 0, 0] })
  const boxId = boxR.result

  function getBBox(graphic, bodyId) {
    if (!graphic?.containers) return null
    const c = graphic.containers.find(c => c.owner === bodyId) || graphic.containers[0]
    return c ? { min: c.properties.min, max: c.properties.max } : null
  }

  const bboxOriginal = getBBox(boxR.graphic, boxId)
  console.log('[19] bbox original:', JSON.stringify(bboxOriginal))
  // Expect X: [10, 70]

  // Mirror across YZ
  const r1 = await api.v1.solid.mirror({
    id: eifId, target: boxId,
    originPos: [0, 0, 0], normal: [1, 0, 0],
  })
  const bboxAfterMirror = getBBox(r1.graphic, boxId)
  console.log('[19] bbox after mirror:', JSON.stringify(bboxAfterMirror))
  // Expect X: [-70, -10]

  // Then translate +100 in X
  const r2 = await api.v1.solid.translation({ id: eifId, target: boxId, translation: [100, 0, 0] })
  const bboxAfterTranslate = getBBox(r2.graphic, boxId)
  console.log('[19] bbox after translate:', JSON.stringify(bboxAfterTranslate))
  // Expect X: [30, 90]

  filewrite({
    original: bboxOriginal,
    afterMirror: bboxAfterMirror,
    afterTranslate: bboxAfterTranslate,
  }, 'mirror-translate-chain')

  return { partId, eifId, boxId }
}
