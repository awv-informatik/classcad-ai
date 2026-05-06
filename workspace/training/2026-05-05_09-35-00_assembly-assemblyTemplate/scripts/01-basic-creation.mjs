export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RootAsm' })).result
  console.log('[01] assembly.create result:', asmId)

  const r = await api.v1.assembly.assemblyTemplate({ name: 'SubAsm1' })
  console.log('[01] assemblyTemplate result:', r.result)
  console.log('[01] assemblyTemplate maxLevel:', r.maxLevel)
  console.log('[01] assemblyTemplate messages:', JSON.stringify(r.messages))

  // Check currentProduct after creation
  const cpBefore = r.structure?.currentProduct
  console.log('[01] currentProduct after assemblyTemplate:', cpBefore)

  // Check structure — where does the template live?
  filewrite(r.structure, 'structure-after-assemblyTemplate')

  // Create a second assembly template to see naming behavior
  const r2 = await api.v1.assembly.assemblyTemplate({ name: 'SubAsm2' })
  console.log('[01] second assemblyTemplate result:', r2.result)

  // Create one without a name
  const r3 = await api.v1.assembly.assemblyTemplate({})
  console.log('[01] unnamed assemblyTemplate result:', r3.result, '(should get default name)')

  return { asmId, subAsm1: r.result, subAsm2: r2.result, subAsm3: r3.result }
}
