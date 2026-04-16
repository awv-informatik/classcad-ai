// 01 — Basic useSolid: pull a solid from a part.box feature into an entity injection
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UseSolidTest' })).result

  // Create a box as a part-level feature (not inside an entity injection)
  const boxFeatId = (await api.v1.part.box({ id: partId, name: 'SourceBox', length: 80, width: 60, height: 40 })).result
  console.log('[01] part.box feature ID:', boxFeatId)

  // Create an entity injection to receive the solid
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'TargetEI' })).result
  console.log('[01] entityInjection ID:', eifId)

  // Use useSolid to pull the box solid into the entity injection
  const r = await api.v1.solid.useSolid({ from: [boxFeatId], in: eifId })
  console.log('[01] useSolid result:', r.result)
  console.log('[01] useSolid maxLevel:', r.maxLevel)
  console.log('[01] useSolid messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'useSolid-response')

  await snapshot('after-useSolid')
  return { partId, boxFeatId, eifId, useSolidResult: r.result }
}
