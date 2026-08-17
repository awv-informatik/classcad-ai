export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylCustom' })).result

  // Create cylinder with custom name, diameter, height
  const r = await api.v1.part.cylinder({ id: partId, name: 'MyCyl', diameter: 60, height: 120 })
  console.log('[02] cylinder result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[02] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'custom-response')

  await snapshot('custom')
  return { partId, cylId: r.result }
}
