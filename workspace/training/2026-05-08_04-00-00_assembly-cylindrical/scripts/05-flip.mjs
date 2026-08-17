export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  // Non-symmetric arm to see rotation effects clearly
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

  // Test each flip value
  const flips = ['Z', '-Z', 'X', '-X', 'Y', '-Y']
  const results = {}

  for (const flip of flips) {
    const inst = (await api.v1.assembly.instance({
      productId: tplB, ownerId: asmId, name: `Arm-${flip}`,
      transformation: [[0, 0, 20], [1, 0, 0], [0, 1, 0]]
    })).result

    const cylR = await api.v1.assembly.cylindrical({
      id: asmId,
      name: `Cyl-${flip}`,
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst], csys: wcsB, flip },
      zOffsetLimits: { min: 20, max: 20 }
    })

    const cog = (await api.v1.part.calculateMassProperties({ id: inst })).result?.cog
    console.log(`[05] flip=${flip}: result=${cylR.result} maxLevel=${cylR.maxLevel} COG=${JSON.stringify(cog)}`)
    results[flip] = { id: cylR.result, cog }

    // Delete the instance and constraint to test next flip cleanly
    await api.v1.assembly.deleteConstraint({ id: cylR.result })
    await api.v1.assembly.deleteInstance({ id: inst })
  }

  filewrite(results, 'flip-cogs')

  // Create one visible example with flip=-Z for snapshot
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Arm-FlipZ',
    transformation: [[0, 0, 20], [1, 0, 0], [0, 1, 0]]
  })).result
  await api.v1.assembly.cylindrical({
    id: asmId, name: 'CylFlipNZ',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB, flip: '-Z' },
    zOffsetLimits: { min: 20, max: 20 }
  })

  await snapshot('flip-negZ')

  return { asmId }
}
