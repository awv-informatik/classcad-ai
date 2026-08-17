// Inverse test: valid radii still create circles; batch with one bad item still creates the good ones.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CirclePart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Circles' })).result

  // Single valid radius — happy path
  const ok = await api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 0], radius: 20 })
  console.log('[inverse] valid radius=20:', ok.maxLevel, JSON.stringify(ok.messages))

  // Batch: one valid, one zero. Zero should be reported as an error; valid one should still create.
  const batch = await api.v1.curve.circle([
    { id: shapeId, centerPos: [10, 0, 0], radius: 5 },
    { id: shapeId, centerPos: [20, 0, 0], radius: 0 },
    { id: shapeId, centerPos: [30, 0, 0], radius: 7 },
  ])
  console.log('[inverse] batch maxLevel:', batch.maxLevel, 'messages:', JSON.stringify(batch.messages))

  filewrite({ ok, batch }, 'inverse-results')

  return { ok, batch }
}
