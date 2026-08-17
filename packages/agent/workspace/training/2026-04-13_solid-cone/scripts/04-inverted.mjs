// Inverted cone — bDiameter < tDiameter, and bDiameter = 0
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvertedCone' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // bDiameter smaller than tDiameter (inverted frustum)
  const r1 = await api.v1.solid.cone({ id: eifId, height: 100, bDiameter: 20, tDiameter: 60 })
  console.log('[04] inverted frustum result:', r1.result, 'maxLevel:', r1.maxLevel)

  await snapshot('inverted-frustum')

  // Clear and try bDiameter = 0 (inverted pointed cone)
  if (r1.result) await api.v1.solid.deleteSolid({ id: eifId, ids: [r1.result] })

  const r2 = await api.v1.solid.cone({ id: eifId, height: 100, bDiameter: 0, tDiameter: 60 })
  console.log('[04] bDiameter=0 result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[04] bDiameter=0 messages:', JSON.stringify(r2.messages))

  filewrite({
    inverted: { result: r1.result, maxLevel: r1.maxLevel },
    bottomZero: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }
  }, 'inverted-results')

  if (r2.result) await snapshot('bottom-zero')
  return { partId, eifId }
}
