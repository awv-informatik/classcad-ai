// Error cases: invalid target ID, invalid EIF id
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ErrorCases' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Case 1: valid EIF, non-existent target
  const r1 = await api.v1.solid.copy({ id: eifId, target: 99999 })
  console.log('[11] case1 (bad target): result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'bad-target-response')

  // Case 2: non-existent EIF id, valid target (create a real solid first)
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
  const r2 = await api.v1.solid.copy({ id: 99999, target: boxId })
  console.log('[11] case2 (bad eif): result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'bad-eif-response')

  // Case 3: copy target is the EIF id itself (not a solid)
  const r3 = await api.v1.solid.copy({ id: eifId, target: eifId })
  console.log('[11] case3 (target=eif): result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'target-is-eif-response')

  // Case 4: copy target is the part id
  const r4 = await api.v1.solid.copy({ id: eifId, target: partId })
  console.log('[11] case4 (target=part): result:', r4.result, 'maxLevel:', r4.maxLevel)
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'target-is-part-response')

  return { partId, eifId, boxId }
}
