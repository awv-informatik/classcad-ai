export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  console.log('[01] assembly created, asmId:', asmId)

  // Create assembly template with no params
  const r1 = await api.v1.assembly.assemblyTemplate()
  console.log('[01] assemblyTemplate() result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'no-params-response')

  // Create assembly template with name
  const r2 = await api.v1.assembly.assemblyTemplate({ name: 'SubAsm1' })
  console.log('[01] assemblyTemplate({ name: SubAsm1 }) result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'named-response')

  // Check currentProduct — did it switch?
  filewrite(r2.structure, 'structure-after-two-templates')

  return { asmId, tpl1: r1.result, tpl2: r2.result }
}
