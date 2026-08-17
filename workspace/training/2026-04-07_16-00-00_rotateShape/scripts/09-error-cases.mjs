// 09 — Error cases: missing params, wrong ID types
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ErrorTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Test' })).result

  // Test 1: Missing rotation param
  const r1 = await api.v1.curve.rotateShape({ id: shapeId })
  console.log('[09] missing rotation — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[09] missing rotation — messages:', JSON.stringify(r1.messages))

  // Test 2: Missing id param
  const r2 = await api.v1.curve.rotateShape({ rotation: [0, 0, 1] })
  console.log('[09] missing id — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[09] missing id — messages:', JSON.stringify(r2.messages))

  // Test 3: Part ID instead of shape ID
  const r3 = await api.v1.curve.rotateShape({ id: partId, rotation: [0, 0, 1] })
  console.log('[09] part id — result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[09] part id — messages:', JSON.stringify(r3.messages))

  // Test 4: EI ID instead of shape ID
  const r4 = await api.v1.curve.rotateShape({ id: eifId, rotation: [0, 0, 1] })
  console.log('[09] ei id — result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[09] ei id — messages:', JSON.stringify(r4.messages))

  // Test 5: Invalid/garbage ID
  const r5 = await api.v1.curve.rotateShape({ id: 'garbage', rotation: [0, 0, 1] })
  console.log('[09] garbage id — result:', r5.result, 'maxLevel:', r5.maxLevel)
  console.log('[09] garbage id — messages:', JSON.stringify(r5.messages))

  filewrite({
    missingRotation: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    missingId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    partId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    eiId: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
    garbageId: { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages },
  }, 'error-cases')

  return { partId }
}
