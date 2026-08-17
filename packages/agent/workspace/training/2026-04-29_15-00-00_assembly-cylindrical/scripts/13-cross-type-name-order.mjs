export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'CrossTypeAsm' })).result

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

  // Case A: cylindrical FIRST, then revolute with same name
  const cylFirst = (await api.v1.assembly.cylindrical({
    id: asmId, name: 'TestOrder',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result

  const revSecond = (await api.v1.assembly.revolute({
    id: asmId, name: 'TestOrder',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst3], csys: wcs3 },
  })).result

  console.log('[13] created cyl:', cylFirst, 'rev:', revSecond)

  const gCylA = await api.v1.assembly.getCylindrical({ id: asmId, name: 'TestOrder' })
  const gRevA = await api.v1.assembly.getRevolute({ id: asmId, name: 'TestOrder' })
  console.log('[13] case A getCylindrical:', gCylA.result?.id, '(cylFirst=', cylFirst, ')')
  console.log('[13] case A getRevolute:', gRevA.result?.id, '(revSecond=', revSecond, ')')
  console.log('[13] case A getCyl maxLevel:', gCylA.maxLevel, 'getRev maxLevel:', gRevA.maxLevel)

  // Dump full responses
  filewrite({
    caseA: {
      cylFirst,
      revSecond,
      getCyl: { result: gCylA.result, maxLevel: gCylA.maxLevel, messages: gCylA.messages },
      getRev: { result: gRevA.result, maxLevel: gRevA.maxLevel, messages: gRevA.messages },
    },
  }, 'cross-type-order')

  return { asmId }
}
