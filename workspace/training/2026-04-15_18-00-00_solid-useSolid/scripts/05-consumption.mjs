// 05 — Does useSolid consume the source feature? Can you use the same source twice?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ConsumptionTest' })).result

  // Create a part-level box
  const boxFeat = (await api.v1.part.box({ id: partId, name: 'SourceBox', length: 80, width: 60, height: 40 })).result
  console.log('[05] source feature:', boxFeat)

  // First useSolid call
  const eif1 = (await api.v1.part.entityInjection({ id: partId, name: 'EI1' })).result
  const r1 = await api.v1.solid.useSolid({ from: [boxFeat], in: eif1 })
  console.log('[05] first useSolid result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'first-use')

  // Second useSolid call — same source
  const eif2 = (await api.v1.part.entityInjection({ id: partId, name: 'EI2' })).result
  const r2 = await api.v1.solid.useSolid({ from: [boxFeat], in: eif2 })
  console.log('[05] second useSolid result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[05] second useSolid messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'second-use')

  await snapshot('after-two-uses')
  return { r1: r1.result, r2: r2.result }
}
