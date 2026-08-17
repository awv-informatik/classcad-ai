// Test extreme scale factors: very large and very small
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleExtremeTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Very large factor
  const box1 = (await api.v1.solid.box({ id: eifId, length: 10, width: 10, height: 10 })).result
  const r1 = await api.v1.solid.scale({ id: eifId, target: box1, factor: 100 })
  console.log('[11] scale 100x result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Very small factor
  const box2 = (await api.v1.solid.box({ id: eifId, length: 100, width: 100, height: 100, translation: [0, 200, 0] })).result
  const r2 = await api.v1.solid.scale({ id: eifId, target: box2, factor: 0.001 })
  console.log('[11] scale 0.001x result:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    large_scale: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    tiny_scale: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'extreme-scale-responses')

  await snapshot('extreme-scales')

  return { partId, eifId, box1, box2 }
}
