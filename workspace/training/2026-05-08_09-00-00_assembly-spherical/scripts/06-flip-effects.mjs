export default async function (api, { snapshot, filewrite }) {
  // Test flip on mate2 — does it reorient inst2 before constraint solving?
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  // Asymmetric arm: 30x10x8 so flip rotations produce different COGs
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 10, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Base'
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  const flips = ['Z', '-Z', 'X', '-X', 'Y', '-Y']
  const results = []

  for (const flip of flips) {
    // Create fresh inst2 for each flip
    const inst2 = (await api.v1.assembly.instance({
      productId: tplB, ownerId: asmId, name: `Arm_${flip}`,
      transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]]
    })).result

    const r = await api.v1.assembly.spherical({
      id: asmId, name: `Ball_${flip}`,
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst2], csys: wcsB, flip }
    })

    const cog = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result?.cog
    console.log(`[06] flip=${flip}: result=${r.result} maxLevel=${r.maxLevel} COG=${JSON.stringify(cog)}`)
    results.push({ flip, constraintId: r.result, maxLevel: r.maxLevel, cog })
  }

  filewrite(results, 'flip-effects-data')
  await snapshot('flip-effects')
  return { asmId }
}
