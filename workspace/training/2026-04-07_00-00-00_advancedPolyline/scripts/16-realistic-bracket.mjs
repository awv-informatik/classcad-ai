// Realistic example: bracket profile with mixed features
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Bracket' })).result

  // L-bracket with fillets and chamfers
  const r = await api.v1.curve.advancedPolyline({
    id: shapeId,
    pld: [
      { xa: 0, ya: 0 },
      { xa: 100, ya: 0, r: 5 },        // bottom right with small fillet
      { xa: 100, ya: 15 },              // up
      { xa: 30, ya: 15, r: 8 },         // inner corner with larger fillet
      { xa: 30, ya: 60, r: 5 },         // up
      { xa: 15, ya: 60, c: 3 },         // chamfer on top corner
      { xr: 0, yr: -45 },               // relative: down (mixed with absolute above)
      { xa: 0, ya: 0 },                 // close manually to origin
    ],
  })

  console.log('[16] result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[16] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'bracket-response')
  await snapshot('bracket-profile')
  return { partId }
}
