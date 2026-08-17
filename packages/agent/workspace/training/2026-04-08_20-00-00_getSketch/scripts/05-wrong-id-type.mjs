// Test getSketch with wrong id types — sketch ID, EIF ID, workplane ID
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.part.sketch({ id: partId, name: 'Sk1' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP1', origin: [0, 0, 0], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result

  console.log('[05] partId:', partId, 'skId:', skId, 'eifId:', eifId, 'wpId:', wpId)

  // Pass sketch ID as id (wrong type)
  const r1 = await api.v1.part.getSketch({ id: skId, name: 'Sk1' })
  console.log('[05] sketch as id — result:', r1.result, 'maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))

  // Pass EIF ID as id (wrong type)
  const r2 = await api.v1.part.getSketch({ id: eifId, name: 'Sk1' })
  console.log('[05] eif as id — result:', r2.result, 'maxLevel:', r2.maxLevel, 'messages:', JSON.stringify(r2.messages))

  // Pass workplane ID as id (wrong type)
  const r3 = await api.v1.part.getSketch({ id: wpId, name: 'Sk1' })
  console.log('[05] wp as id — result:', r3.result, 'maxLevel:', r3.maxLevel, 'messages:', JSON.stringify(r3.messages))

  filewrite({
    sketchAsId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    eifAsId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    wpAsId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'wrong-id-type-response')

  return { partId }
}
