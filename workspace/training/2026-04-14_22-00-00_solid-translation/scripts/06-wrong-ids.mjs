// 06 — Error cases: wrong ID types for `id` and `target` params
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WrongIds' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 50, height: 50 })).result

  // Test 1: Pass partId as `id` instead of eifId
  const r1 = await api.v1.solid.translation({ id: partId, target: boxId, translation: [10, 0, 0] })
  console.log('[06] partId as id — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[06] partId as id — messages:', JSON.stringify(r1.messages))

  // Test 2: Pass invalid target ID (9999)
  const r2 = await api.v1.solid.translation({ id: eifId, target: 9999, translation: [10, 0, 0] })
  console.log('[06] invalid target — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[06] invalid target — messages:', JSON.stringify(r2.messages))

  // Test 3: Pass eifId as target (not a solid)
  const r3 = await api.v1.solid.translation({ id: eifId, target: eifId, translation: [10, 0, 0] })
  console.log('[06] eifId as target — result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[06] eifId as target — messages:', JSON.stringify(r3.messages))

  filewrite({
    partIdAsId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    invalidTarget: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    eifAsTarget: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'wrong-ids')

  return { partId, eifId, boxId }
}
