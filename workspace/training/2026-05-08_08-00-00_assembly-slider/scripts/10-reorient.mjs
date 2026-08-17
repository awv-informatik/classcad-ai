export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 100, width: 20, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  // Asymmetric block: 40×10×8 — easy to see orientation changes
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 40, width: 10, height: 8 })
  const wcsB = (await api.v1.part.workCSys({
    id: tplB, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplA, ownerId: asmId, name: 'Rail'
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'Ground',
    mate1: { path: [inst1], csys: wcsA }
  })

  // Test reorient: '0', '90', '180', '270'
  // Since slider locks all rotation, reorient should be visible directly
  const reorients = ['0', '90', '180', '270']
  const results = {}

  for (let i = 0; i < reorients.length; i++) {
    const ro = reorients[i]
    const inst2 = (await api.v1.assembly.instance({
      productId: tplB, ownerId: asmId, name: `Arm_${ro}`,
      transformation: [[0, 0, 15 + i * 15], [1, 0, 0], [0, 1, 0]]
    })).result

    const r = await api.v1.assembly.slider({
      id: asmId, name: `Slide_${ro}`,
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst2], csys: wcsB, reorient: ro }
    })

    const cog = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
    results[`reorient_${ro}`] = { result: r.result, maxLevel: r.maxLevel, cog: cog?.cog }
    console.log(`[10] reorient=${ro}: COG=${JSON.stringify(cog?.cog)}`)
  }

  filewrite(results, 'reorient-data')
  await snapshot('reorient')

  return results
}
