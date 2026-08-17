export default async function (api, { snapshot, filewrite }) {
  // Create assembly root
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  console.log('[01] asmId:', asmId)

  // Create a part template
  const r = await api.v1.assembly.partTemplate({ name: 'Plate' })
  console.log('[01] partTemplate result:', r.result)
  console.log('[01] partTemplate maxLevel:', r.maxLevel)
  console.log('[01] partTemplate messages:', JSON.stringify(r.messages))

  // Check structure for currentProduct after partTemplate
  const structInfo = {
    root: r.structure?.root,
    currentProduct: r.structure?.currentProduct,
    currentInstance: r.structure?.currentInstance,
  }
  console.log('[01] structure after partTemplate:', JSON.stringify(structInfo))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages, structInfo }, 'partTemplate-response')

  return { asmId, tplId: r.result }
}
