export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Query nonexistent name
  const r = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'DoesNotExist' })
  console.log('[03] nonexistent result:', r.result)
  console.log('[03] maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'nonexistent-result')

  return {}
}
