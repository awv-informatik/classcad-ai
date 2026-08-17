// Test: what happens if first PLD is not absolute coords?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'NoStart' })).result

  // Start with relative coords instead of absolute
  const r = await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xr: 10, yr: 10 },     // relative — no absolute start!
      { xr: 30, yr: 0 },
      { xr: 0, yr: 20 },
    ],
    close: true,
  })

  console.log('[17] no-abs-start - result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[17] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'no-start-response')
  await snapshot('no-abs-start')
  return { partId }
}
