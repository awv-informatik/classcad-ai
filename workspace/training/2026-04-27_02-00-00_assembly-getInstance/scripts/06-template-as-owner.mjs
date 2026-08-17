export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Assembly template with children
  const asmTplId = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  const partTplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: partTplId, name: 'B1', length: 40, width: 30, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmTplId })
  const child1 = (await api.v1.assembly.instance({ productId: partTplId, ownerId: asmTplId, name: 'C1' })).result
  const child2 = (await api.v1.assembly.instance({ productId: partTplId, ownerId: asmTplId, name: 'C2' })).result
  console.log('[06] children in template:', child1, child2)

  // Get instances from assembly template
  const rTpl = await api.v1.assembly.getInstance({ ownerId: asmTplId })
  console.log('[06] template children result:', JSON.stringify(rTpl.result))
  console.log('[06] template children maxLevel:', rTpl.maxLevel)

  // Get by name from template
  const rByName = await api.v1.assembly.getInstance({ ownerId: asmTplId, name: 'C2' })
  console.log('[06] by name from template:', rByName.result, '(expected:', child2, ')')

  filewrite({
    templateId: asmTplId,
    children: { child1, child2 },
    getAll: { result: rTpl.result, maxLevel: rTpl.maxLevel },
    byName: { result: rByName.result, maxLevel: rByName.maxLevel },
  }, 'template-owner')

  return { asmId }
}
