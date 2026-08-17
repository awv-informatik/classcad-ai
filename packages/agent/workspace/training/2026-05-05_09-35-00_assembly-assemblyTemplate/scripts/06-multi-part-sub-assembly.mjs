export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Create two part templates
  const baseTpl = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: baseTpl, name: 'BaseBody', length: 80, width: 60, height: 10 })

  const pillarTpl = (await api.v1.assembly.partTemplate({ name: 'Pillar' })).result
  await api.v1.part.cylinder({ id: pillarTpl, name: 'PillarBody', height: 50, diameter: 15 })

  // Create a sub-assembly template that combines base + 4 pillars
  const tableSub = (await api.v1.assembly.assemblyTemplate({ name: 'Table' })).result
  console.log('[06] table sub-assembly:', tableSub)

  // Instance base at origin
  await api.v1.assembly.setCurrentProduct({ id: tableSub })
  const baseInst = (await api.v1.assembly.instance({
    productId: baseTpl,
    ownerId: tableSub,
    name: 'TableBase',
  })).result

  // Instance 4 pillars at the corners (offset from origin)
  const pillar1 = (await api.v1.assembly.instance({
    productId: pillarTpl,
    ownerId: tableSub,
    name: 'Leg1',
    transformation: [[10, 10, 10], [1, 0, 0], [0, 1, 0]],
  })).result
  const pillar2 = (await api.v1.assembly.instance({
    productId: pillarTpl,
    ownerId: tableSub,
    name: 'Leg2',
    transformation: [[70, 10, 10], [1, 0, 0], [0, 1, 0]],
  })).result
  const pillar3 = (await api.v1.assembly.instance({
    productId: pillarTpl,
    ownerId: tableSub,
    name: 'Leg3',
    transformation: [[10, 50, 10], [1, 0, 0], [0, 1, 0]],
  })).result
  const pillar4 = (await api.v1.assembly.instance({
    productId: pillarTpl,
    ownerId: tableSub,
    name: 'Leg4',
    transformation: [[70, 50, 10], [1, 0, 0], [0, 1, 0]],
  })).result

  console.log('[06] instances in sub-assembly:', baseInst, pillar1, pillar2, pillar3, pillar4)

  // Return to root and instance the table at two positions
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const table1 = (await api.v1.assembly.instance({
    productId: tableSub,
    ownerId: asmId,
    name: 'Table1',
  })).result

  const table2 = (await api.v1.assembly.instance({
    productId: tableSub,
    ownerId: asmId,
    name: 'Table2',
    transformation: [[120, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  console.log('[06] table instances in root:', table1, table2)

  await snapshot('multi-part-sub-assembly')
  await snapshot('multi-part-top', { view: 'top' })

  // Verify COG for both tables
  const cog1 = (await api.v1.assembly.calculateMassProperties({ id: table1 })).result
  const cog2 = (await api.v1.assembly.calculateMassProperties({ id: table2 })).result
  console.log('[06] table1 COG:', JSON.stringify(cog1))
  console.log('[06] table2 COG:', JSON.stringify(cog2))

  filewrite({ cog1, cog2 }, 'multi-part-cog')

  return { table1, table2 }
}
