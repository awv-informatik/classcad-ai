export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly with 2 instances of a box template
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 80, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst2',
    transformation: [[200, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create fastened with xOffset=50
  const fId = (await api.v1.assembly.fastened({
    id: asmId, name: 'TestFastened',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 50,
  })).result
  console.log('[01] fastened created:', fId, 'maxLevel:', (await api.v1.assembly.getFastened({ id: asmId, name: 'TestFastened' })).maxLevel)

  // Measure COG after creation
  const mass1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[01] COG after creation (xOffset=50):', mass1.centerOfGravity)
  await snapshot('after-create')

  // Update: change xOffset to 100
  const r1 = await api.v1.assembly.updateFastened({ id: fId, xOffset: 100 })
  console.log('[01] updateFastened xOffset=100:', r1.result, 'maxLevel:', r1.maxLevel)

  const mass2 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[01] COG after update (xOffset=100):', mass2.centerOfGravity)
  await snapshot('after-update-x100')

  // Update: add yOffset=40
  const r2 = await api.v1.assembly.updateFastened({ id: fId, yOffset: 40 })
  console.log('[01] updateFastened yOffset=40:', r2.result, 'maxLevel:', r2.maxLevel)

  const mass3 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[01] COG after update (yOffset=40 added):', mass3.centerOfGravity)

  // Verify xOffset preserved via getFastened
  const state = (await api.v1.assembly.getFastened({ id: asmId, name: 'TestFastened' })).result
  console.log('[01] getFastened state: xOffset=', state.xOffset, 'yOffset=', state.yOffset, 'zOffset=', state.zOffset)
  filewrite(state, 'final-state')

  await snapshot('after-update-y40')
  return { fId }
}
