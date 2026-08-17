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
    id: asmId, name: 'F1',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 50,
  })).result
  console.log('[02] fastened ID:', fId)

  // Dump full mass result to understand the structure
  const massRaw = await api.v1.assembly.calculateMassProperties({ id: asmId })
  console.log('[02] mass result keys:', Object.keys(massRaw.result || {}))
  console.log('[02] mass maxLevel:', massRaw.maxLevel)
  filewrite(massRaw.result, 'mass-after-create')

  await snapshot('after-create')

  // Update to xOffset=100
  const r1 = await api.v1.assembly.updateFastened({ id: fId, xOffset: 100 })
  console.log('[02] update xOffset=100: result=', r1.result, 'maxLevel:', r1.maxLevel)

  const mass2Raw = await api.v1.assembly.calculateMassProperties({ id: asmId })
  filewrite(mass2Raw.result, 'mass-after-update')
  await snapshot('after-update')

  // Get instance positions (via getInstance)
  const gi1 = await api.v1.assembly.getInstance({ id: asmId, name: 'Inst1' })
  const gi2 = await api.v1.assembly.getInstance({ id: asmId, name: 'Inst2' })
  console.log('[02] inst1 transform:', JSON.stringify(gi1.result?.transformation))
  console.log('[02] inst2 transform:', JSON.stringify(gi2.result?.transformation))
  filewrite({ inst1: gi1.result, inst2: gi2.result }, 'instances-after-update')

  return { fId }
}
