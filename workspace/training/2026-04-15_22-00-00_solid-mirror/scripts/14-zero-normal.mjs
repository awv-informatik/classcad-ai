// Edge case: zero normal vector [0,0,0] — what happens?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ZeroNormal' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20, translation: [20, 0, 0] })).result

  function getBBox(graphic, bodyId) {
    if (!graphic?.containers) return null
    const c = graphic.containers.find(c => c.owner === bodyId) || graphic.containers[0]
    return c ? { min: c.properties.min, max: c.properties.max } : null
  }

  try {
    const r = await api.v1.solid.mirror({
      id: eifId, target: boxId,
      originPos: [0, 0, 0], normal: [0, 0, 0],
    })
    const bbox = getBBox(r.graphic, boxId)
    console.log('[14] zero normal: result=', r.result, 'maxLevel=', r.maxLevel)
    console.log('[14] zero normal: bbox=', JSON.stringify(bbox))
    console.log('[14] zero normal: messages=', JSON.stringify(r.messages))
    filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages, bbox }, 'zero-normal')
  } catch (e) {
    console.log('[14] zero normal: error=', e.message)
    filewrite({ error: e.message }, 'zero-normal')
  }

  return { partId, eifId, boxId }
}
