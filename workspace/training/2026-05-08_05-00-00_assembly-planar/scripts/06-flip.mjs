export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 40, width: 25, height: 30 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result

  // Create 3 instances with different flip values
  const flips = ['Z', '-Z', 'X']
  const results = {}
  for (const flip of flips) {
    const inst = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: `Block_${flip}` })).result
    await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

    const r = await api.v1.assembly.planar({
      id: asmId,
      name: `Planar_${flip}`,
      mate1: { path: [inst1], csys: wcsA },
      mate2: { path: [inst], csys: wcsB, flip },
      zOffset: 15,
    })
    console.log(`[06] flip=${flip}: result=${r.result}, maxLevel=${r.maxLevel}`)

    const cog = (await api.v1.part.calculateMassProperties({ id: inst })).result
    console.log(`[06] flip=${flip} COG:`, JSON.stringify(cog.cog))
    results[flip] = { instId: inst, constraintId: r.result, cog: cog.cog }
  }

  filewrite(results, 'flip-comparison')
  await snapshot('flips', { view: 'front' })
  await snapshot('flips-iso')

  return results
}
