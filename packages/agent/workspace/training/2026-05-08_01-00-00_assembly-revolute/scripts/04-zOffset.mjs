export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Template A: base 60x40x10
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'BoxA', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'CsysA', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Template B: arm 80x20x8
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'BoxB', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'CsysB', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Base',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[100, 50, 30], [1, 0, 0], [0, 1, 0]],
  })).result

  // Ground inst1
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA },
  })

  // Revolute with zOffset=25 — should move inst2 up by 25 along Z (since Z is the revolute axis)
  const r = await api.v1.assembly.revolute({
    id: asmId, name: 'Rev1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 25,
  })
  console.log('[04] revolute result:', r.result, 'maxLevel:', r.maxLevel)

  const mass2 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[04] inst2 COG:', JSON.stringify(mass2?.cog))
  // Expected: (40, 10, 4+25) = (40, 10, 29) if zOffset shifts along Z-axis

  const mass1 = (await api.v1.part.calculateMassProperties({ id: inst1 })).result
  console.log('[04] inst1 COG:', JSON.stringify(mass1?.cog))

  await snapshot('zOffset-25')
  await snapshot('zOffset-25-front', { view: 'front' })

  // Readback
  const getR = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Rev1' })).result
  console.log('[04] getRevolute zOffset:', getR?.zOffset)

  filewrite({ inst1: mass1, inst2: mass2, constraint: getR }, 'zOffset-data')

  return { asmId, inst1, inst2 }
}
