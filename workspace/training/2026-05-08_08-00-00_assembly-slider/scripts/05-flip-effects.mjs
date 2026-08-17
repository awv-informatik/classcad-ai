export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Rail' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 100, width: 20, height: 10 })
  const wcsA = (await api.v1.part.workCSys({
    id: tplA, name: 'Csys', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  // Asymmetric block so orientation changes are visible
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 10, height: 8 })
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

  // Test different flip values
  const flips = ['Z', '-Z', 'X', '-X', 'Y', '-Y']
  const results = {}

  for (const flip of flips) {
    // Fresh instance each time at [20, 0, 15]
    const inst2 = (await api.v1.assembly.instance({
      productId: tplB, ownerId: asmId, name: `Block_${flip}`,
      transformation: [[20, 0, 15], [1, 0, 0], [0, 1, 0]]
    })).result

    const r = await api.v1.assembly.slider({
      id: asmId, name: `Slide_${flip}`,
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst2], csys: wcsB, flip },
      xOffset: 20
    })

    const cog = (await api.v1.assembly.calculateMassProperties({ id: inst2 })).result
    results[flip] = { result: r.result, maxLevel: r.maxLevel, cog: cog?.cog }
    console.log(`[05] flip=${flip}: result=${r.result} maxLevel=${r.maxLevel} COG=${JSON.stringify(cog?.cog)}`)
  }

  filewrite(results, 'flip-effects-data')
  await snapshot('flip-effects')

  return results
}
