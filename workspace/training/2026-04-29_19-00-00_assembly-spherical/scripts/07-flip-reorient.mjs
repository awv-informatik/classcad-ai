export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FlipTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 60, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Socket', origin: [40, 30, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Rod', length: 10, width: 10, height: 60 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Joint', origin: [5, 5, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

  const flips = ['Z', '-Z', 'X', '-X', 'Y', '-Y']
  const reorients = ['0', '90', '180', '270']
  const results = []

  // Test all flip values on mate2
  for (const flip of flips) {
    await api.v1.assembly.deleteConstraint({ ids: results.map(r => r.id).filter(Boolean) }).catch(() => {})
    results.length = 0

    const r = await api.v1.assembly.spherical({
      id: asmId,
      name: `Flip_${flip}`,
      mate1: { path: [inst1], csys: wcs1 },
      mate2: { path: [inst2], csys: wcs2, flip },
    })
    console.log(`[07] flip=${flip}: result=${r.result} maxLevel=${r.maxLevel}`)
    results.push({ flip, id: r.result, maxLevel: r.maxLevel })
    if (r.result) await api.v1.assembly.deleteConstraint({ ids: [r.result] })
  }

  // Test all reorient values
  for (const reorient of reorients) {
    const r = await api.v1.assembly.spherical({
      id: asmId,
      name: `Reorient_${reorient}`,
      mate1: { path: [inst1], csys: wcs1 },
      mate2: { path: [inst2], csys: wcs2, reorient },
    })
    console.log(`[07] reorient=${reorient}: result=${r.result} maxLevel=${r.maxLevel}`)
    results.push({ reorient, id: r.result, maxLevel: r.maxLevel })
    if (r.result) await api.v1.assembly.deleteConstraint({ ids: [r.result] })
  }

  filewrite(results, 'flip-reorient-results')
  return { asmId }
}
