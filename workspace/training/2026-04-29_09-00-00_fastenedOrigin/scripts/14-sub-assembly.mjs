export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FO_SubAsm' })).result

  // Part template
  const partTpl = (await api.v1.assembly.partTemplate({ name: 'Cube' })).result
  await api.v1.part.box({ id: partTpl, name: 'Box', length: 20, width: 20, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: partTpl, name: 'WCS', origin: [10, 10, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Sub-assembly template with two instances
  const subAsmTpl = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  const subInst1 = (await api.v1.assembly.instance({
    productId: partTpl, ownerId: subAsmTpl, name: 'SubCube1',
  })).result
  const subInst2 = (await api.v1.assembly.instance({
    productId: partTpl, ownerId: subAsmTpl, name: 'SubCube2',
    transformation: [[40, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Go back to root assembly
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance the sub-assembly
  const subAsmInst = (await api.v1.assembly.instance({
    productId: subAsmTpl, ownerId: asmId, name: 'SubAsmInst',
  })).result

  console.log('[14] subAsmInst:', subAsmInst)

  // Get the expanded tree children
  const etChildren = (await api.v1.assembly.getInstance({ ownerId: subAsmInst })).result
  console.log('[14] expanded tree children:', JSON.stringify(etChildren?.map(c => ({ id: c.id, name: c.name }))))
  filewrite(etChildren, 'et-children')

  // Try fastenedOrigin with sub-assembly instance (the parent)
  const r1 = await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'FO_SubAsm',
    mate1: { path: [subAsmInst], csys: wcs },
  })
  console.log('[14] fastenedOrigin on sub-asm instance:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[14] messages:', r1.messages.map(m => m.message).join('; '))

  filewrite({
    subAsmResult: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
  }, 'sub-asm-results')

  // If the sub-asm approach failed, try with ET child directly
  if (r1.maxLevel > 31) {
    const etChildId = etChildren?.[0]?.id
    if (etChildId) {
      const r2 = await api.v1.assembly.fastenedOrigin({
        id: asmId,
        name: 'FO_ET',
        mate1: { path: [etChildId], csys: wcs },
      })
      console.log('[14] fastenedOrigin on ET child:', r2.result, 'maxLevel:', r2.maxLevel)
      if (r2.messages?.length) console.log('[14] ET messages:', r2.messages.map(m => m.message).join('; '))
      filewrite({ etResult: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages } }, 'et-result')
    }
  }

  await snapshot('sub-assembly')

  return { asmId }
}
