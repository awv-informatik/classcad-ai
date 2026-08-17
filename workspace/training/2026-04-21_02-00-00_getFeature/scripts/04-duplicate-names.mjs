export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result

  // Create two boxes with default name — both get "Box"?
  const box1 = (await api.v1.part.box({ id: partId })).result
  const box2 = (await api.v1.part.box({ id: partId })).result
  console.log('[04] box1:', box1, 'box2:', box2)

  // What does getFeature return — first, second, or error?
  const r1 = await api.v1.part.getFeature({ id: partId, name: 'Box' })
  console.log('[04] "Box" result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[04] matches box1?', r1.result === box1)
  console.log('[04] matches box2?', r1.result === box2)

  // Check if second box got auto-renamed
  const r2 = await api.v1.part.getFeature({ id: partId, name: 'Box_1' })
  console.log('[04] "Box_1" result:', r2.result, 'maxLevel:', r2.maxLevel)

  const r3 = await api.v1.part.getFeature({ id: partId, name: 'Box 2' })
  console.log('[04] "Box 2" result:', r3.result, 'maxLevel:', r3.maxLevel)

  const r4 = await api.v1.part.getFeature({ id: partId, name: 'Box_2' })
  console.log('[04] "Box_2" result:', r4.result, 'maxLevel:', r4.maxLevel)

  filewrite({
    box1, box2,
    lookupBox: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    lookupBox_1: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    lookupBox2: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    lookupBox_2: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'duplicate-names')

  return { partId }
}
