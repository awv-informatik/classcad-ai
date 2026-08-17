// 06 — Edge cases: zero radius, negative radius
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ZeroNegRadiusFillet' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  const edgeR = await api.v1.part.getBrepGeometryByIndex({ id: eifId, lineIndex: 0 })
  const edgeId = edgeR.result

  // Try radius=0
  const r1 = await api.v1.solid.fillet({ id: eifId, radius: 0, geomIds: [edgeId] })
  console.log('[06] radius=0 result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) {
    for (const m of r1.messages) console.log(`[06] zero msg: level=${m.level} "${m.message}"`)
  }
  filewrite({ radius: 0, result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'zero-radius')

  // Recreate box for negative radius test (in case zero modified it)
  const partId2 = (await api.v1.part.create({ name: 'NegRadiusFillet' })).result
  const eifId2 = (await api.v1.part.entityInjection({ id: partId2, name: 'EIF2' })).result
  const boxId2 = (await api.v1.solid.box({ id: eifId2, length: 80, width: 60, height: 40 })).result
  const edgeR2 = await api.v1.part.getBrepGeometryByIndex({ id: eifId2, lineIndex: 0 })
  const edgeId2 = edgeR2.result

  // Try radius=-5
  const r2 = await api.v1.solid.fillet({ id: eifId2, radius: -5, geomIds: [edgeId2] })
  console.log('[06] radius=-5 result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) {
    for (const m of r2.messages) console.log(`[06] neg msg: level=${m.level} "${m.message}"`)
  }
  filewrite({ radius: -5, result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'negative-radius')

  return { partId }
}
