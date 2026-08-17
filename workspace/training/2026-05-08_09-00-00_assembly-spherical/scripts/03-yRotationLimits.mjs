export default async function (api, { snapshot, filewrite }) {
  // Test yRotationLimits param — the only constraint param specific to spherical
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 40, width: 10, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Base'
  })).result

  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm'
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  // Test 1: spherical with yRotationLimits.max in radians
  const r1 = await api.v1.assembly.spherical({
    id: asmId, name: 'Ball_Rad',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    yRotationLimits: { max: 0.785 } // ~45 degrees
  })
  console.log('[03] rad result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[03] rad messages:', JSON.stringify(r1.messages))

  // Query to see how it's stored
  const g1 = await api.v1.assembly.getSpherical({ id: asmId, name: 'Ball_Rad' })
  console.log('[03] getSpherical rad:', JSON.stringify(g1.result))

  // Delete and try with degree string
  await api.v1.assembly.deleteConstraint({ id: r1.result })

  const r2 = await api.v1.assembly.spherical({
    id: asmId, name: 'Ball_Deg',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    yRotationLimits: { max: '45deg' }
  })
  console.log('[03] deg result:', r2.result, 'maxLevel:', r2.maxLevel)

  const g2 = await api.v1.assembly.getSpherical({ id: asmId, name: 'Ball_Deg' })
  console.log('[03] getSpherical deg:', JSON.stringify(g2.result))

  // Test 3: spherical without yRotationLimits (should be absent/null in get)
  await api.v1.assembly.deleteConstraint({ id: r2.result })

  const r3 = await api.v1.assembly.spherical({
    id: asmId, name: 'Ball_NoLim',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB }
  })
  console.log('[03] nolim result:', r3.result, 'maxLevel:', r3.maxLevel)

  const g3 = await api.v1.assembly.getSpherical({ id: asmId, name: 'Ball_NoLim' })
  console.log('[03] getSpherical nolim:', JSON.stringify(g3.result))

  filewrite({
    radResult: g1.result,
    degResult: g2.result,
    noLimResult: g3.result
  }, 'yRotation-data')

  await snapshot('yRotation')
  return { asmId }
}
