// Test: ident param, multiple loadProduct calls into same assembly
export default async function (api, { snapshot, filewrite }) {
  // Create two different parts and save them separately
  // Part 1: Box
  const p1 = (await api.v1.part.create({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: p1, name: 'Box', length: 60, width: 40, height: 20 })
  const saved1 = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  const data1 = saved1.result.content

  // Part 2: Cylinder
  await api.v1.common.clear({})
  const p2 = (await api.v1.part.create({ name: 'CylPart' })).result
  await api.v1.part.cylinder({ id: p2, name: 'Cyl', diameter: 30, height: 50 })
  const saved2 = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  const data2 = saved2.result.content

  // Create assembly
  await api.v1.common.clear({})
  const asmId = (await api.v1.assembly.create({ name: 'MultiAsm' })).result

  // Load product 1 with ident
  const load1 = await api.v1.assembly.loadProduct({
    data: data1, format: 'OFB', encoding: 'base64', compression: 'deflate',
    ident: 'box-template',
  })
  const tpl1 = load1.result.id
  console.log('[05] Loaded box template:', tpl1, 'maxLevel:', load1.maxLevel)

  // Load product 2 with ident
  const load2 = await api.v1.assembly.loadProduct({
    data: data2, format: 'OFB', encoding: 'base64', compression: 'deflate',
    ident: 'cyl-template',
  })
  const tpl2 = load2.result.id
  console.log('[05] Loaded cyl template:', tpl2, 'maxLevel:', load2.maxLevel)

  // Check structure — both should be in PartContainer
  filewrite(load2.structure, 'structure-multi')

  // Instantiate both
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BoxInst' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'CylInst',
    transformation: [[80, 15, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[05] BoxInst:', inst1, 'CylInst:', inst2)

  // Check if ident is queryable via setIdent or getPartTemplate
  const getTpl1 = await api.v1.assembly.getPartTemplate({ name: 'BoxPart' })
  console.log('[05] getPartTemplate by name "BoxPart":', JSON.stringify(getTpl1.result))

  // Verify COG
  const mass1 = (await api.v1.assembly.calculateMassProperties({ id: inst1 })).result
  const mass2 = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
  console.log('[05] BoxInst COG:', JSON.stringify(mass1.cog))
  console.log('[05] CylInst COG:', JSON.stringify(mass2.cog))
  filewrite({ box: mass1, cyl: mass2 }, 'multi-mass')

  await snapshot('multi-products')
  return { tpl1, tpl2, inst1, inst2 }
}
