export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Elongated block to make rotation visible
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 60, width: 10, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm',
    transformation: [[0, 0, 12], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  const cogBefore = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[03] COG before:', JSON.stringify(cogBefore?.cog))

  // Lock rotation to 45 degrees
  const r = await api.v1.assembly.parallel({
    id: asmId,
    name: 'RotTest',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zRotationLimits: { min: '45deg', max: '45deg' },
  })
  console.log('[03] parallel result:', r.result, 'maxLevel:', r.maxLevel)

  const cogAfter = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[03] COG after (should show rotation):', JSON.stringify(cogAfter?.cog))

  // Arm local COG = [30, 5, 4], at z=12
  // With 45° rotation: x ≈ 30*cos45 - 5*sin45 ≈ 17.68, y ≈ 30*sin45 + 5*cos45 ≈ 24.75
  // z should stay at 12+4=16 if z-position preserved

  filewrite({ cogBefore: cogBefore?.cog, cogAfter: cogAfter?.cog }, 'rotation-limits-cog')
  await snapshot('rotation-locked-45')
  return { asmId, inst1, inst2 }
}
