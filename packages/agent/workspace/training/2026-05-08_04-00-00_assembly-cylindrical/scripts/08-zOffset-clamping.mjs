export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  // Test 1: inst2 starts BELOW min → should clamp to min
  const inst2a = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'BelowMin',
    transformation: [[0, 0, 5], [1, 0, 0], [0, 1, 0]]
  })).result
  await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylBelowMin',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2a], csys: wcsB },
    zOffsetLimits: { min: 20, max: 40 }
  })
  const cogA = (await api.v1.part.calculateMassProperties({ id: inst2a })).result?.cog
  console.log('[08] below min (start z=5, range 20..40): COG z =', cogA?.z, '→ expected ~24 (20+4)')

  // Test 2: inst2 starts WITHIN range → should preserve
  const inst2b = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'WithinRange',
    transformation: [[0, 0, 30], [1, 0, 0], [0, 1, 0]]
  })).result
  await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylWithin',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2b], csys: wcsB },
    zOffsetLimits: { min: 20, max: 40 }
  })
  const cogB = (await api.v1.part.calculateMassProperties({ id: inst2b })).result?.cog
  console.log('[08] within range (start z=30, range 20..40): COG z =', cogB?.z, '→ expected ~34 (30+4)')

  // Test 3: inst2 starts ABOVE max → should clamp to max
  const inst2c = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'AboveMax',
    transformation: [[0, 0, 60], [1, 0, 0], [0, 1, 0]]
  })).result
  await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylAbove',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2c], csys: wcsB },
    zOffsetLimits: { min: 20, max: 40 }
  })
  const cogC = (await api.v1.part.calculateMassProperties({ id: inst2c })).result?.cog
  console.log('[08] above max (start z=60, range 20..40): COG z =', cogC?.z, '→ expected ~44 (40+4)')

  // Test 4: min-only limit (max=null)
  const inst2d = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'MinOnly',
    transformation: [[0, 0, 5], [1, 0, 0], [0, 1, 0]]
  })).result
  const r4 = await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylMinOnly',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2d], csys: wcsB },
    zOffsetLimits: { min: 20 }
  })
  console.log('[08] min-only result:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages?.length) r4.messages.forEach(m => console.log('[08]   msg:', m.message))
  const cogD = (await api.v1.part.calculateMassProperties({ id: inst2d })).result?.cog
  console.log('[08] min-only (start z=5, min=20): COG z =', cogD?.z)

  // Test 5: negative offset limits
  const inst2e = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'NegLimits',
    transformation: [[0, 0, -30], [1, 0, 0], [0, 1, 0]]
  })).result
  await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylNeg',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2e], csys: wcsB },
    zOffsetLimits: { min: -20, max: -10 }
  })
  const cogE = (await api.v1.part.calculateMassProperties({ id: inst2e })).result?.cog
  console.log('[08] negative limits (start z=-30, range -20..-10): COG z =', cogE?.z, '→ expected ~-16 (-20+4)')

  filewrite({
    belowMin: cogA,
    withinRange: cogB,
    aboveMax: cogC,
    minOnly: cogD,
    negLimits: cogE
  }, 'clamping-results')

  await snapshot('clamping')

  return { asmId }
}
