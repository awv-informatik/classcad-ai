export default async function (api, { filewrite }) {
  // Create assembly with content, convert, then delete the converted template
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
  await api.v1.part.box({ id: tplId, name: 'B', length: 30, width: 20, height: 10 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tplId,
    ownerId: asmId,
    name: 'Inst1',
  })).result

  // Convert
  await api.v1.assembly.convertToTemplate({ name: 'ToDelete' })
  const convertedId = (await api.v1.assembly.getAssemblyTemplate({ name: 'ToDelete' })).result
  const newRoot = (await api.v1.assembly.getAssemblyTemplate({ name: 'ToDelete' })).structure?.root
  console.log('[07] convertedId:', convertedId, 'newRoot:', newRoot)

  // Instance the converted template
  const subInst = (await api.v1.assembly.instance({
    productId: convertedId,
    ownerId: newRoot,
    name: 'SubInst',
  })).result
  console.log('[07] subInst:', subInst)

  // Verify templates before delete
  const asmTplsBefore = (await api.v1.assembly.getAssemblyTemplate({})).result
  const partTplsBefore = (await api.v1.assembly.getPartTemplate({})).result
  console.log('[07] asm templates before delete:', JSON.stringify(asmTplsBefore))
  console.log('[07] part templates before delete:', JSON.stringify(partTplsBefore))

  // Delete the converted template
  const delR = await api.v1.assembly.deleteTemplate({ ids: [convertedId] })
  console.log('[07] deleteTemplate result:', delR.result, 'maxLevel:', delR.maxLevel)
  if (delR.messages?.length) console.log('[07] messages:', JSON.stringify(delR.messages))

  // Verify templates after delete
  const asmTplsAfter = (await api.v1.assembly.getAssemblyTemplate({})).result
  const partTplsAfter = (await api.v1.assembly.getPartTemplate({})).result
  console.log('[07] asm templates after delete:', JSON.stringify(asmTplsAfter))
  console.log('[07] part templates after delete:', JSON.stringify(partTplsAfter))

  // Check if instance was cascade-deleted
  const instances = (await api.v1.assembly.getInstance({})).result
  console.log('[07] instances after delete:', JSON.stringify(instances))

  filewrite({
    convertedId,
    newRoot,
    subInst,
    beforeDelete: { asmTpls: asmTplsBefore, partTpls: partTplsBefore },
    deleteResult: { result: delR.result, maxLevel: delR.maxLevel, messages: delR.messages },
    afterDelete: { asmTpls: asmTplsAfter, partTpls: partTplsAfter, instances },
  }, 'delete-converted')

  return {}
}
