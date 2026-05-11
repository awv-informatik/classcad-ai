export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Create templates with revolute axes
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Gear1' })).result
  await api.v1.part.cylinder({ id: tpl1, name: 'Cyl1', height: 10, diameter: 40 })
  const wcs1 = (await api.v1.part.workCSys({ id: tpl1, name: 'WCS1', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Gear2' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'Cyl2', height: 10, diameter: 20 })
  const wcs2 = (await api.v1.part.workCSys({ id: tpl2, name: 'WCS2', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const ground = (await api.v1.assembly.partTemplate({ name: 'Ground' })).result
  await api.v1.part.box({ id: ground, name: 'Box', length: 100, width: 100, height: 5 })
  const wcsG = (await api.v1.part.workCSys({ id: ground, name: 'WCSG', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const instG = (await api.v1.assembly.instance({ productId: ground, ownerId: asmId, name: 'Ground' })).result
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'G1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'G2', transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, instance: instG, name: 'FO', mate1: { path: [instG], csys: wcsG } })

  // Create revolute constraints for gear1 and gear2
  const rev1 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev1',
    mate1: { path: [instG], csys: wcsG },
    mate2: { path: [inst1], csys: wcs1 },
    zOffset: 5,
  })).result
  const rev2 = (await api.v1.assembly.revolute({
    id: asmId, name: 'Rev2',
    mate1: { path: [instG], csys: wcsG },
    mate2: { path: [inst2], csys: wcs2 },
    zOffset: 5,
  })).result
  console.log('[08] rev1:', rev1, 'rev2:', rev2)

  // Two-phase gear creation
  const gearId = (await api.v1.assembly.createUncommitedObject({
    id: asmId,
    type: 'CC_GearRelation',
    name: 'GearRel',
  })).result
  console.log('[08] uncommitted gear id:', gearId)

  await api.v1.part.openFeature({ id: gearId })
  const updateR = await api.v1.assembly.updateGear({
    id: gearId,
    constr1Id: rev1,
    constr2Id: rev2,
    ratio: 2.0,
  })
  console.log('[08] updateGear result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'update-gear')

  await api.v1.part.closeFeature({ id: gearId })

  // Verify
  const getR = await api.v1.assembly.getGear({ id: asmId, name: 'GearRel' })
  console.log('[08] getGear result:', getR.result?.id, 'ratio:', getR.result?.ratio)
  filewrite(getR.result, 'get-gear')

  await snapshot('after-gear')
  return { gearId }
}
