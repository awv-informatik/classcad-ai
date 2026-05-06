export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'MultiTplTest' })).result
  console.log('[05] asmId:', asmId)

  // Create multiple templates — test default naming and explicit naming
  const tpl1R = await api.v1.assembly.partTemplate({})
  console.log('[05] tpl1 (no name):', tpl1R.result)

  const tpl2R = await api.v1.assembly.partTemplate({ name: 'Plate' })
  console.log('[05] tpl2 (Plate):', tpl2R.result)

  const tpl3R = await api.v1.assembly.partTemplate({ name: 'Bolt' })
  console.log('[05] tpl3 (Bolt):', tpl3R.result)

  // Default name template — another one without name
  const tpl4R = await api.v1.assembly.partTemplate({})
  console.log('[05] tpl4 (no name):', tpl4R.result)

  // Build different geometry in each
  await api.v1.part.box({ id: tpl1R.result, name: 'Box1', length: 60, width: 40, height: 10 })
  await api.v1.part.box({ id: tpl2R.result, name: 'Box2', length: 30, width: 30, height: 50 })
  await api.v1.part.cylinder({ id: tpl3R.result, name: 'Cyl', diameter: 10, height: 40 })
  await api.v1.part.sphere({ id: tpl4R.result, name: 'Sph', radius: 15 })

  // Retrieve all templates via getPartTemplate (no name = get all)
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const allTpls = await api.v1.assembly.getPartTemplate({})
  console.log('[05] getPartTemplate (all):', JSON.stringify(allTpls.result))

  // Retrieve by name
  const plateR = await api.v1.assembly.getPartTemplate({ name: 'Plate' })
  console.log('[05] getPartTemplate(Plate):', plateR.result)

  // Instantiate all with offsets to verify
  const i1 = (await api.v1.assembly.instance({ productId: tpl1R.result, ownerId: asmId, name: 'I1' })).result
  const i2 = (await api.v1.assembly.instance({
    productId: tpl2R.result, ownerId: asmId, name: 'I2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const i3 = (await api.v1.assembly.instance({
    productId: tpl3R.result, ownerId: asmId, name: 'I3',
    transformation: [[160, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const i4 = (await api.v1.assembly.instance({
    productId: tpl4R.result, ownerId: asmId, name: 'I4',
    transformation: [[240, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Measure COGs of instances for spatial verification
  const m1 = (await api.v1.assembly.calculateMassProperties({ id: i1 })).result
  const m2 = (await api.v1.assembly.calculateMassProperties({ id: i2 })).result
  const m3 = (await api.v1.assembly.calculateMassProperties({ id: i3 })).result
  const m4 = (await api.v1.assembly.calculateMassProperties({ id: i4 })).result

  console.log('[05] COG i1 (box 60x40x10 at origin):', JSON.stringify(m1.cog))
  console.log('[05] COG i2 (box 30x30x50 at x=80):', JSON.stringify(m2.cog))
  console.log('[05] COG i3 (cyl d=10 h=40 at x=160):', JSON.stringify(m3.cog))
  console.log('[05] COG i4 (sphere r=15 at x=240):', JSON.stringify(m4.cog))

  filewrite(
    {
      templates: { tpl1: tpl1R.result, tpl2: tpl2R.result, tpl3: tpl3R.result, tpl4: tpl4R.result },
      allFromGetPartTemplate: allTpls.result,
      plateById: plateR.result,
      instances: { i1, i2, i3, i4 },
      cogs: { m1, m2, m3, m4 },
    },
    'multiple-templates'
  )

  await snapshot('multiple-instances')

  return { asmId }
}
