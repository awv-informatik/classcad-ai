export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'A',
  })).result

  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'B',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Try different approaches for mass properties
  const r1 = await api.v1.assembly.calculateMassProperties({ id: asmId })
  console.log('[03b] assembly.calculateMassProperties result type:', typeof r1.result)
  console.log('[03b] assembly.calculateMassProperties result keys:', r1.result ? Object.keys(r1.result) : 'null/undefined')
  console.log('[03b] assembly.calculateMassProperties maxLevel:', r1.maxLevel)

  const r2 = await api.v1.part.calculateMassProperties({ id: asmId })
  console.log('[03b] part.calculateMassProperties result type:', typeof r2.result)
  console.log('[03b] part.calculateMassProperties result keys:', r2.result ? Object.keys(r2.result) : 'null/undefined')
  console.log('[03b] part.calculateMassProperties maxLevel:', r2.maxLevel)

  // Try on the template directly
  const r3 = await api.v1.part.calculateMassProperties({ id: tpl })
  console.log('[03b] part.calculateMassProperties(tpl) result keys:', r3.result ? Object.keys(r3.result) : 'null/undefined')

  filewrite({ asmMass: r1, partMassAsm: r2, partMassTpl: r3 }, 'mass-debug')

  return { asmId }
}
