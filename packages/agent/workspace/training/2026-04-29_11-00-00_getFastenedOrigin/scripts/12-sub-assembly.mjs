export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GFO_SubAsm' })).result

  // Part template
  const partTpl = (await api.v1.assembly.partTemplate({ name: 'Cube' })).result
  await api.v1.part.box({ id: partTpl, name: 'Box', length: 30, width: 30, height: 30 })
  const wcs = (await api.v1.part.workCSys({
    id: partTpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Sub-assembly template
  const subAsmTpl = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result

  // Instance part inside sub-asm
  const subInst = (await api.v1.assembly.instance({
    productId: partTpl, ownerId: subAsmTpl, name: 'SubInst',
  })).result

  // Fasten inside sub-assembly
  const subFoId = (await api.v1.assembly.fastenedOrigin({
    id: subAsmTpl,
    name: 'SubFO',
    mate1: { path: [subInst], csys: wcs },
  })).result

  // Instance sub-assembly in root
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const rootSubInst = (await api.v1.assembly.instance({
    productId: subAsmTpl, ownerId: asmId, name: 'SubAsmInst',
  })).result

  // Get ET children
  const etChildren = (await api.v1.assembly.getInstance({ ownerId: rootSubInst })).result
  console.log('[12] etChildren:', etChildren)

  // Get FO from sub-assembly template
  const rSub = await api.v1.assembly.getFastenedOrigin({ id: subAsmTpl, name: 'SubFO' })
  console.log('[12] sub-asm getFO result:', JSON.stringify(rSub.result, null, 2))
  console.log('[12] sub-asm maxLevel:', rSub.maxLevel)

  // Try with root asm (should fail — constraint is not on root)
  const rRoot = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'SubFO' })
  console.log('[12] root asm getFO result:', rRoot.result, 'maxLevel:', rRoot.maxLevel)

  filewrite({
    subAsmResult: { result: rSub.result, maxLevel: rSub.maxLevel },
    rootAsmResult: { result: rRoot.result, maxLevel: rRoot.maxLevel },
  }, 'sub-assembly-get')

  await snapshot('sub-asm')

  return { asmId }
}
