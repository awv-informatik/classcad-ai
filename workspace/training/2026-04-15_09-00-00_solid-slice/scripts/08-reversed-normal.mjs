// Test reversed normal: [0,0,-1] at z=0
// If the behavior is "positive side removed": normal pointing DOWN means keep the TOP half
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceRevNormal' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  const refId = (await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 10, translation: [60, 0, 0] })).result
  console.log('[08] boxId:', boxId, 'refId:', refId)

  // Slice at z=0 with normal [0,0,-1] (pointing down)
  // If "positive side removed": positive side of [0,0,-1] is z < 0 → remove bottom → keep top
  const r = await api.v1.solid.slice({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [0, 0, -1],
    keepBoth: false,
  })
  console.log('[08] slice result:', r.result, 'maxLevel:', r.maxLevel)

  const c = r.graphic?.containers?.[0]
  if (c) {
    console.log('[08] AFTER min:', JSON.stringify(c.properties.min))
    console.log('[08] AFTER max:', JSON.stringify(c.properties.max))
  }
  filewrite({
    result: r.result,
    messages: r.messages,
    maxLevel: r.maxLevel,
    bbox: c ? { min: c.properties.min, max: c.properties.max } : null,
  }, 'slice-reversed-response')

  await snapshot('after-reversed-normal')

  return { partId, boxId }
}
