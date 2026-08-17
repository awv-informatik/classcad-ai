// True pointed cone — tDiameter near zero and exactly zero
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TrueCone' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // tDiameter = 0.1 (docs example uses this)
  const r1 = await api.v1.solid.cone({ id: eifId, height: 100, bDiameter: 60, tDiameter: 0.1 })
  console.log('[02] tDiameter=0.1 result:', r1.result, 'maxLevel:', r1.maxLevel)

  await snapshot('near-zero-top')

  // Clear and try tDiameter = 0 (true point)
  if (r1.result) {
    await api.v1.solid.deleteSolid({ id: eifId, ids: [r1.result] })
  }

  const r2 = await api.v1.solid.cone({ id: eifId, height: 100, bDiameter: 60, tDiameter: 0 })
  console.log('[02] tDiameter=0 result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[02] tDiameter=0 messages:', JSON.stringify(r2.messages))

  filewrite({ nearZero: { result: r1.result, maxLevel: r1.maxLevel }, exactZero: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages } }, 'true-cone-results')

  if (r2.result) await snapshot('exact-zero-top')
  return { partId, eifId }
}
