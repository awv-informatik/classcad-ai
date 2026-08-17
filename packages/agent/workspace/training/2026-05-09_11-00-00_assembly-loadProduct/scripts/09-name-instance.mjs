// Test instantiating a loadProduct template by name (string productId)
export default async function (api, { snapshot, filewrite }) {
  const p = (await api.v1.part.create({ name: 'NamedPart' })).result
  await api.v1.part.box({ id: p, name: 'Body', length: 40, width: 30, height: 20 })
  const saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  const ofbData = saved.result.content

  await api.v1.common.clear({})
  const asmId = (await api.v1.assembly.create({ name: 'NameAsm' })).result
  const tplId = (await api.v1.assembly.loadProduct({
    data: ofbData, format: 'OFB', encoding: 'base64', compression: 'deflate',
  })).result.id
  console.log('[09] Template ID:', tplId)

  // Check the name
  const getTpl = await api.v1.assembly.getPartTemplate({ name: 'NamedPart' })
  console.log('[09] getPartTemplate "NamedPart":', getTpl.result, 'maxLevel:', getTpl.maxLevel)

  // Instantiate by name string
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = await api.v1.assembly.instance({ productId: 'NamedPart', ownerId: asmId, name: 'ByName' })
  console.log('[09] Instance by name result:', inst1.result, 'maxLevel:', inst1.maxLevel)

  // Instantiate by numeric ID
  const inst2 = await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'ById',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[09] Instance by ID result:', inst2.result, 'maxLevel:', inst2.maxLevel)

  // Verify both have geometry
  if (inst1.result && inst2.result) {
    const m1 = (await api.v1.assembly.calculateMassProperties({ id: inst1.result })).result
    const m2 = (await api.v1.assembly.calculateMassProperties({ id: inst2.result })).result
    console.log('[09] ByName COG:', JSON.stringify(m1.cog))
    console.log('[09] ById COG:', JSON.stringify(m2.cog))
    filewrite({ byName: m1, byId: m2 }, 'name-vs-id-mass')
  }

  await snapshot('name-instances')
  return {}
}
