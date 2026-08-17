export default async function (api, { snapshot, filewrite }) {
  // Test offset parameters: does xOffset/yOffset/zOffset shift inst2?
  // Use same template, csys at origin, but apply offsets
  const asmId = (await api.v1.assembly.create({})).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({ id: tpl, name: 'Origin', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  console.log('[03] tpl:', tpl, 'wcs:', wcs)

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
  })).result

  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst2',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[03] inst1:', inst1, 'inst2:', inst2)

  // Create fastened with xOffset=50
  const r = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F_Offset',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 50,
  })
  console.log('[03] fastened result:', r.result, 'maxLevel:', r.maxLevel)

  await api.v1.common.recalc({})
  await snapshot('x-offset-50')

  const mass = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] COG with xOffset=50:', JSON.stringify(mass?.cog))
  // Expected: if inst2 moves to x=50 offset from inst1 origin,
  // inst1 COG = (20,15,10), inst2 COG = (70,15,10)
  // combined COG x = (20+70)/2 = 45
  filewrite(mass, 'mass-xoffset50')

  return { fastenedId: r.result }
}
