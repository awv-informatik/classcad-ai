export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  console.log('[01] assembly.create:', asmId)

  const r = await api.v1.assembly.partTemplate({ name: 'BoxPart' })
  console.log('[01] partTemplate result:', r.result)
  console.log('[01] partTemplate maxLevel:', r.maxLevel)
  console.log('[01] partTemplate messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'partTemplate-response')
  filewrite(r.structure, 'partTemplate-structure')

  console.log('[01] structure.currentProduct:', r.structure?.currentProduct)
  console.log('[01] structure.root:', r.structure?.root)

  return { asmId, tplId: r.result }
}
