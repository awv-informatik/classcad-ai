// Test: CENTER — work point at center of a circle/arc
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a sketch with a circle
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const circR = await api.v1.sketch.circle({ id: skId, centerPos: [40, 30, 0], radius: 20 })
  const circId = circR.result
  console.log('[07] circle:', circId, 'maxLevel:', circR.maxLevel)

  if (circId) {
    const r = await api.v1.part.workPoint({ id: partId, name: 'WP_center', type: 'CENTER', references: [circId] })
    console.log('[07] CENTER(sketch-circle) result:', r.result, 'maxLevel:', r.maxLevel)
    console.log('[07] messages:', JSON.stringify(r.messages))
    filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'center-sketch')
  }

  return { partId }
}
