// Test: Is the `id` param even checked for boolean operations?
// Try: id=partId (not an EIF), id=99999 (non-existent)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IdIrrelevant' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const target = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  const tool = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 60, translation: [50, 20, 0] })).result

  // id = partId (not an EIF)
  const r1 = await api.v1.solid.union({ id: partId, target, tools: [tool] })
  console.log('[15] id=partId: result=', r1.result, 'maxLevel=', r1.maxLevel)
  if (r1.messages?.length) console.log('[15] messages:', JSON.stringify(r1.messages))

  // Clean up and retry with completely bogus id
  await api.v1.solid.deleteSolid({ id: eifId })
  const target2 = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  const tool2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 60, translation: [50, 20, 0] })).result

  const r2 = await api.v1.solid.union({ id: 99999, target: target2, tools: [tool2] })
  console.log('[15] id=99999: result=', r2.result, 'maxLevel=', r2.maxLevel)
  if (r2.messages?.length) console.log('[15] messages:', JSON.stringify(r2.messages))

  filewrite({
    idAsPartId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    idAsBogus: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }
  }, 'id-irrelevant-results')

  return { partId }
}
