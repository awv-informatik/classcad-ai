// Degenerate cases — zero height, negative dimensions, both diameters zero
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Degenerate' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Zero height
  const r1 = await api.v1.solid.cone({ id: eifId, height: 0, bDiameter: 60, tDiameter: 20 })
  console.log('[05] height=0 result:', r1.result, 'maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))

  // Negative height
  const r2 = await api.v1.solid.cone({ id: eifId, height: -50, bDiameter: 60, tDiameter: 20 })
  console.log('[05] height=-50 result:', r2.result, 'maxLevel:', r2.maxLevel, 'messages:', JSON.stringify(r2.messages))

  // Negative diameters
  const r3 = await api.v1.solid.cone({ id: eifId, height: 100, bDiameter: -60, tDiameter: 20 })
  console.log('[05] bDiam=-60 result:', r3.result, 'maxLevel:', r3.maxLevel, 'messages:', JSON.stringify(r3.messages))

  // Both diameters zero
  const r4 = await api.v1.solid.cone({ id: eifId, height: 100, bDiameter: 0, tDiameter: 0 })
  console.log('[05] both diam=0 result:', r4.result, 'maxLevel:', r4.maxLevel, 'messages:', JSON.stringify(r4.messages))

  filewrite({
    zeroHeight: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    negHeight: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    negBDiam: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    bothZero: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages }
  }, 'degenerate-results')

  return { partId, eifId }
}
