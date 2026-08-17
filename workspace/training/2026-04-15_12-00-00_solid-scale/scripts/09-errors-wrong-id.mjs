// Test error cases: wrong ID types
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleErrorTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })).result

  // Error 1: pass partId instead of eifId
  const r1 = await api.v1.solid.scale({ id: partId, target: boxId, factor: 2 })
  console.log('[09] partId as id — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[09] partId as id — messages:', JSON.stringify(r1.messages))

  // Error 2: pass eifId as target
  const r2 = await api.v1.solid.scale({ id: eifId, target: eifId, factor: 2 })
  console.log('[09] eifId as target — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[09] eifId as target — messages:', JSON.stringify(r2.messages))

  // Error 3: invalid ID (999999)
  const r3 = await api.v1.solid.scale({ id: eifId, target: 999999, factor: 2 })
  console.log('[09] invalid target — result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[09] invalid target — messages:', JSON.stringify(r3.messages))

  filewrite({
    partId_as_id: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    eifId_as_target: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    invalid_target: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'error-responses')

  return { partId, eifId, boxId }
}
