// Test loadProduct with STP format
export default async function (api, { snapshot, filewrite }) {
  // Create a part with a cylinder, save as STP
  const partId = (await api.v1.part.create({ name: 'CylPart' })).result
  await api.v1.part.cylinder({ id: partId, name: 'Cyl1', diameter: 30, height: 50 })

  const saved = await api.v1.common.save({ format: 'STP', encoding: 'base64' })
  console.log('[04] STP save success:', saved.result.success, 'content length:', saved.result.content.length)
  const stpData = saved.result.content

  // Create assembly and load STP
  await api.v1.common.clear({})
  const asmId = (await api.v1.assembly.create({ name: 'StpAsm' })).result

  const loadRes = await api.v1.assembly.loadProduct({ data: stpData, format: 'STP', encoding: 'base64' })
  console.log('[04] loadProduct STP result:', JSON.stringify(loadRes.result))
  console.log('[04] loadProduct STP maxLevel:', loadRes.maxLevel)
  if (loadRes.messages.length > 0) {
    console.log('[04] messages:', JSON.stringify(loadRes.messages.slice(0, 3)))
  }
  filewrite(loadRes.result, 'stp-load-result')

  if (loadRes.result && loadRes.result.id) {
    const tplId = loadRes.result.id
    await api.v1.assembly.setCurrentProduct({ id: asmId })

    const inst = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'StpInst' })).result
    console.log('[04] STP instance:', inst)

    const mass = (await api.v1.assembly.calculateMassProperties({ id: inst })).result
    console.log('[04] STP inst COG:', JSON.stringify(mass.cog))
    filewrite(mass, 'stp-mass')

    await snapshot('stp-instance')
  }

  return { asmId }
}
