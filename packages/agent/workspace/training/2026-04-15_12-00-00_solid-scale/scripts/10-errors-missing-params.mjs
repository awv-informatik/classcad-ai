// Test error cases: missing required parameters
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleMissingTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })).result

  // Missing factor
  const r1 = await api.v1.solid.scale({ id: eifId, target: boxId })
  console.log('[10] no factor — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[10] no factor — messages:', JSON.stringify(r1.messages))

  // Missing target
  const r2 = await api.v1.solid.scale({ id: eifId, factor: 2 })
  console.log('[10] no target — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[10] no target — messages:', JSON.stringify(r2.messages))

  // Missing id
  const r3 = await api.v1.solid.scale({ target: boxId, factor: 2 })
  console.log('[10] no id — result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[10] no id — messages:', JSON.stringify(r3.messages))

  filewrite({
    no_factor: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    no_target: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    no_id: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'missing-param-responses')

  return { partId, eifId, boxId }
}
