// Q: Can you freely mix all PLD modes within a single polyline?
// Build a complex profile using every mode type in sequence
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'MixedModes' })).result

  const r = await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },                    // Mode: absolute start
      { xr: 50, yr: 0 },                   // Mode: relative
      { l: 30, a: Math.PI / 2 },           // Mode: absolute angle+length (north)
      { l: 20, ar: Math.PI / 4 },          // Mode: relative angle+length (45° CCW from north = NW)
      { xa: 20, ya: 80 },                  // Mode: absolute (jump to specific point)
      { xr: -10, ya: 60 },                 // Mode: mixed (relative X, absolute Y)
      { xa: 0, yr: -10 },                  // Mode: mixed (absolute X, relative Y)
      { yr: -20, a: -Math.PI / 4 },        // Mode: movement+angle (yr constraint + angle)
    ],
    close: true,
  })

  console.log('[04] mixed modes: maxLevel', r.maxLevel, 'messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'mixed-modes-response')

  await snapshot('mixed-modes')
  return { partId }
}
