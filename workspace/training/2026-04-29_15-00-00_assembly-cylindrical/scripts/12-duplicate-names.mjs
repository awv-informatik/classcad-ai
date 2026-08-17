export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'CylDupAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Axis1', origin: [40, 25, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Rod' })).result
  await api.v1.part.box({ id: tpl2, name: 'Rod', length: 10, width: 10, height: 60 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Axis2', origin: [5, 5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl3, name: 'Arm', length: 15, width: 15, height: 40 })
  const wcs3 = (await api.v1.part.workCSys({
    id: tpl3, name: 'Axis3', origin: [7.5, 7.5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'BaseInst' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'RodInst' })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'ArmInst' })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO1', mate1: { path: [inst1], csys: wcs1 } })

  // Create two constraints with same name
  const c1 = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'DupName',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zOffsetLimits: { min: -10, max: 10 },
  })).result

  const c2 = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'DupName',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst3], csys: wcs3 },
    zOffsetLimits: { min: -20, max: 20 },
  })).result

  console.log('[12] c1:', c1, 'c2:', c2)

  // Get returns first match
  const g = await api.v1.assembly.getCylindrical({ id: asmId, name: 'DupName' })
  console.log('[12] get DupName:', g.result?.id, '(c1=', c1, 'c2=', c2, ')')
  console.log('[12] first match offset:', JSON.stringify(g.result?.zOffsetLimits))

  // getCylindrical only finds cylindrical, not other constraint types
  await api.v1.assembly.revolute({
    id: asmId, name: 'SharedName',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })
  const c3 = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'SharedName',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst3], csys: wcs3 },
  })).result

  const gCyl = await api.v1.assembly.getCylindrical({ id: asmId, name: 'SharedName' })
  const gRev = await api.v1.assembly.getRevolute({ id: asmId, name: 'SharedName' })
  console.log('[12] getCylindrical SharedName:', gCyl.result?.id, '(should be c3=', c3, ')')
  console.log('[12] getRevolute SharedName:', gRev.result?.id, '(should be revolute)')

  filewrite({
    dupName: { c1, c2, getResult: g.result?.id },
    crossType: { cylId: gCyl.result?.id, revId: gRev.result?.id, c3 },
  }, 'duplicate-names')

  return { asmId }
}
