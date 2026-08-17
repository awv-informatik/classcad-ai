// Test error cases: wrong ID types, consumed tools, missing params
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ErrorTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 50, height: 50 })).result

  const results = {}

  // 1. partId as `id` instead of eifId
  const r1 = await api.v1.solid.rotation({ id: partId, target: boxId, rotation: [0, 0, Math.PI / 4] })
  console.log('[09] partId as id:', r1.result, 'maxLevel:', r1.maxLevel, 'msg:', r1.messages?.[0]?.message)
  results.wrongIdType = { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }

  // 2. Invalid target (9999)
  const r2 = await api.v1.solid.rotation({ id: eifId, target: 9999, rotation: [0, 0, Math.PI / 4] })
  console.log('[09] invalid target:', r2.result, 'maxLevel:', r2.maxLevel, 'msg:', r2.messages?.[0]?.message)
  results.invalidTarget = { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }

  // 3. eifId as target (wrong type)
  const r3 = await api.v1.solid.rotation({ id: eifId, target: eifId, rotation: [0, 0, Math.PI / 4] })
  console.log('[09] eifId as target:', r3.result, 'maxLevel:', r3.maxLevel, 'msg:', r3.messages?.[0]?.message)
  results.wrongTargetType = { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }

  // 4. Missing rotation param
  const r4 = await api.v1.solid.rotation({ id: eifId, target: boxId })
  console.log('[09] missing rotation:', r4.result, 'maxLevel:', r4.maxLevel, 'msg:', r4.messages?.[0]?.message)
  results.missingRotation = { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages }

  // 5. Missing target param
  const r5 = await api.v1.solid.rotation({ id: eifId, rotation: [0, 0, 1] })
  console.log('[09] missing target:', r5.result, 'maxLevel:', r5.maxLevel, 'msg:', r5.messages?.[0]?.message)
  results.missingTarget = { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages }

  filewrite(results, 'error-cases')
  return { boxId }
}
