// Test: What happens when `id` param doesn't match the target's EIF?
// e.g., target is in EIF1, but `id: eif2`
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IdMismatch' })).result
  const eif1 = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const eif2 = (await api.v1.part.entityInjection({ id: partId, name: 'EIF2' })).result

  // Target and tool both in EIF1
  const target = (await api.v1.solid.box({ id: eif1, length: 80, width: 60, height: 40 })).result
  const tool = (await api.v1.solid.box({ id: eif1, length: 40, width: 30, height: 60, translation: [50, 20, 0] })).result

  // But pass id: eif2 (wrong EIF)
  const r = await api.v1.solid.union({ id: eif2, target, tools: [tool] })
  console.log('[14] union wrong id: result=', r.result, 'maxLevel=', r.maxLevel)
  if (r.messages?.length) console.log('[14] messages:', JSON.stringify(r.messages))

  // Also test: target in EIF1, tool in EIF2, id = EIF2 (tool's EIF, not target's)
  await api.v1.solid.deleteSolid({ id: eif1 })
  const target2 = (await api.v1.solid.box({ id: eif1, length: 80, width: 60, height: 40 })).result
  const tool2 = (await api.v1.solid.box({ id: eif2, length: 40, width: 30, height: 60, translation: [50, 20, 0] })).result
  const r2 = await api.v1.solid.union({ id: eif2, target: target2, tools: [tool2] })
  console.log('[14] union target-eif1 id-eif2: result=', r2.result, 'maxLevel=', r2.maxLevel)
  if (r2.messages?.length) console.log('[14] messages:', JSON.stringify(r2.messages))

  filewrite({
    wrongEif: { result: r.result, maxLevel: r.maxLevel, messages: r.messages },
    crossEifWrongId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }
  }, 'id-mismatch-results')

  return { partId }
}
