export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RotTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Box', length: 60, width: 40, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [30, 20, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Box', length: 40, width: 10, height: 10 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [0, 5, 5],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BaseInst',
  })).result

  // Test 1: zRotation in radians (90° = π/2)
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'ArmRad',
  })).result
  const r1 = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F_Rad90',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
    zRotation: Math.PI / 2,
  })
  console.log('[03] radian rotation result:', r1.result, 'maxLevel:', r1.maxLevel)

  await snapshot('rad90')

  // Test 2: zRotation using degree string syntax
  const inst3 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'ArmDeg',
  })).result
  const r2 = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F_Deg45',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst3], csys: wcs2 },
    zRotation: '45deg',
    zOffset: 15,
  })
  console.log('[03] degree rotation result:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('deg45')

  // Test 3: Combined xRotation + zRotation
  const inst4 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'ArmCombo',
  })).result
  const r3 = await api.v1.assembly.fastened({
    id: asmId,
    name: 'F_Combo',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst4], csys: wcs2 },
    xRotation: '90deg',
    zRotation: '45deg',
    xOffset: -30,
  })
  console.log('[03] combo rotation result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({
    rad90: { id: r1.result, maxLevel: r1.maxLevel },
    deg45: { id: r2.result, maxLevel: r2.maxLevel },
    combo: { id: r3.result, maxLevel: r3.maxLevel },
  }, 'rotation-results')

  await snapshot('combo')

  return { asmId }
}
