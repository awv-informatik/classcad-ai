export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RevFlipTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [40, 25, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Use distinctly shaped arm for visual clarity
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Arm', length: 10, width: 30, height: 70 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [5, 15, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BaseInst',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'ArmInst',
  })).result

  // Test each flip on mate2 while keeping mate1 as default Z
  const flips = ['Z', '-Z', 'X', '-X', 'Y', '-Y']
  for (const flip of flips) {
    // Delete previous constraint if exists (after first iteration)
    const existing = await api.v1.assembly.getRevolute({ id: asmId, name: 'FlipTest' })
    if (existing.result) {
      await api.v1.assembly.deleteConstraint({ id: existing.result.id })
    }

    const r = await api.v1.assembly.revolute({
      id: asmId,
      name: 'FlipTest',
      mate1: { path: [inst1], csys: wcs1 },
      mate2: { path: [inst2], csys: wcs2, flip },
    })
    console.log(`[04] flip=${flip}: result=${r.result}, maxLevel=${r.maxLevel}`)
    await snapshot(`flip-${flip.replace('-', 'neg')}`)
  }

  // Get the last one to verify flip is stored
  const g = await api.v1.assembly.getRevolute({ id: asmId, name: 'FlipTest' })
  filewrite(g.result, 'last-flip-data')

  return { asmId }
}
