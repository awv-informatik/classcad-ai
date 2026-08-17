// 03 — useSolid from an entity injection feature (not just part-level features)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FromEI' })).result

  // Create source entity injection with solids
  const srcEif = (await api.v1.part.entityInjection({ id: partId, name: 'SourceEI' })).result
  const boxId = (await api.v1.solid.box({ id: srcEif, length: 60, width: 40, height: 30 })).result
  const cylId = (await api.v1.solid.cylinder({ id: srcEif, height: 50, diameter: 20, translation: [80, 0, 0] })).result
  console.log('[03] source EI:', srcEif, 'box:', boxId, 'cylinder:', cylId)

  // Create destination entity injection
  const dstEif = (await api.v1.part.entityInjection({ id: partId, name: 'DestEI' })).result
  console.log('[03] dest EI:', dstEif)

  // Try useSolid from entity injection
  const r = await api.v1.solid.useSolid({ from: [srcEif], in: dstEif })
  console.log('[03] useSolid from EI result:', r.result)
  console.log('[03] useSolid from EI maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'useSolid-from-ei')

  await snapshot('from-ei')
  return { srcEif, dstEif, useSolidResult: r.result }
}
