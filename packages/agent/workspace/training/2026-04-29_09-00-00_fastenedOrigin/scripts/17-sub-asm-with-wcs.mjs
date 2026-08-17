export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FO_SubAsm2' })).result

  // Part template
  const partTpl = (await api.v1.assembly.partTemplate({ name: 'Cube' })).result
  await api.v1.part.box({ id: partTpl, name: 'Box', length: 20, width: 20, height: 20 })
  const partWcs = (await api.v1.part.workCSys({
    id: partTpl, name: 'WCS', origin: [10, 10, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Sub-assembly template with its own WCS
  const subAsmTpl = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  const subInst = (await api.v1.assembly.instance({
    productId: partTpl, ownerId: subAsmTpl, name: 'SubCube',
  })).result

  // Go back to root assembly
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance the sub-assembly
  const subAsmInst = (await api.v1.assembly.instance({
    productId: subAsmTpl, ownerId: asmId, name: 'SubAsmInst',
  })).result

  // Get expanded tree children
  const etChildren = (await api.v1.assembly.getInstance({ ownerId: subAsmInst })).result
  console.log('[17] ET children count:', etChildren?.length)

  // Try fastenedOrigin with ET child and the part's WCS
  if (etChildren?.length > 0) {
    const etChildId = etChildren[0]
    console.log('[17] ET child ID:', etChildId)

    const r = await api.v1.assembly.fastenedOrigin({
      id: asmId,
      name: 'FO_ET',
      mate1: { path: [etChildId], csys: partWcs },
    })
    console.log('[17] fastenedOrigin on ET child:', r.result, 'maxLevel:', r.maxLevel)
    if (r.messages?.length) console.log('[17] messages:', r.messages.map(m => m.message).join('; '))
    filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'et-child-result')
  }

  // Also try fastenedOrigin on sub-assembly instance using sub-instance's path
  // This uses sub-assembly instance in path with part's WCS
  const r2 = await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'FO_SubInst',
    mate1: { path: [subAsmInst, subInst], csys: partWcs },
  })
  console.log('[17] multi-element path:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[17] multi-path messages:', r2.messages.map(m => m.message).join('; '))
  filewrite({ result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'multi-path-result')

  await snapshot('sub-asm-wcs')

  return { asmId }
}
