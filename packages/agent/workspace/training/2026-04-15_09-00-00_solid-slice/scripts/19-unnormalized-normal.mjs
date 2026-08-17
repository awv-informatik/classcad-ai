// Test with unnormalized normal vector — does it need to be unit length?
// Also test with zero normal
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceNormLen' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Case 1: unnormalized normal [0, 0, 100] (magnitude 100, direction +Z)
  const b1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 40 })).result
  console.log('[19] b1:', b1)

  const r1 = await api.v1.solid.slice({
    id: eifId, target: b1,
    originPos: [0, 0, 0], normal: [0, 0, 100], keepBoth: false,
  })
  console.log('[19] unnorm result:', r1.result, 'maxLevel:', r1.maxLevel)
  const c1 = r1.graphic?.containers?.find(c => c.owner === b1)
  if (c1) console.log('[19] unnorm bbox:', JSON.stringify(c1.properties.min), JSON.stringify(c1.properties.max))

  // Case 2: zero normal [0, 0, 0]
  const b2 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 40, translation: [80, 0, 0] })).result
  console.log('[19] b2:', b2)

  const r2 = await api.v1.solid.slice({
    id: eifId, target: b2,
    originPos: [0, 0, 0], normal: [0, 0, 0], keepBoth: false,
  })
  console.log('[19] zero normal result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[19] zero normal messages:', JSON.stringify(r2.messages))

  filewrite({
    unnormalized: { result: r1.result, maxLevel: r1.maxLevel, bbox: c1 ? { min: c1.properties.min, max: c1.properties.max } : null },
    zeroNormal: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'normal-tests')

  await snapshot('after-normal-tests')

  return { partId }
}
