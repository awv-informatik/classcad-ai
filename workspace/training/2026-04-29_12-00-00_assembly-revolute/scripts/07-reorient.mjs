export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'RevReorientTest' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'WCS', origin: [40, 25, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Use asymmetric arm shape to see reorientation clearly
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'LArm' })).result
  await api.v1.part.box({ id: tpl2, name: 'Main', length: 10, width: 40, height: 70 })
  // Add a small bump to break symmetry
  await api.v1.part.box({ id: tpl2, name: 'Bump', length: 10, width: 10, height: 10, originX: 0, originY: 0, originZ: 70 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'WCS', origin: [5, 20, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl1, ownerId: asmId, name: 'BaseInst',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl2, ownerId: asmId, name: 'ArmInst',
  })).result

  // Test each reorient value on mate2
  const reorients = ['0', '90', '180', '270']
  const results = {}
  for (const reorient of reorients) {
    const existing = await api.v1.assembly.getRevolute({ id: asmId, name: 'ReorientTest' })
    if (existing.result) {
      await api.v1.assembly.deleteConstraint({ id: existing.result.id })
    }

    const r = await api.v1.assembly.revolute({
      id: asmId,
      name: 'ReorientTest',
      mate1: { path: [inst1], csys: wcs1 },
      mate2: { path: [inst2], csys: wcs2, reorient },
    })
    console.log(`[07] reorient=${reorient}: result=${r.result}, maxLevel=${r.maxLevel}`)
    results[reorient] = r.result
    await snapshot(`reorient-${reorient}`)
  }

  // Get the last one to verify stored value
  const g = await api.v1.assembly.getRevolute({ id: asmId, name: 'ReorientTest' })
  filewrite(g.result, 'last-reorient-data')

  // Test invalid reorient value
  const badExisting = await api.v1.assembly.getRevolute({ id: asmId, name: 'ReorientTest' })
  if (badExisting.result) {
    await api.v1.assembly.deleteConstraint({ id: badExisting.result.id })
  }

  const rBad = await api.v1.assembly.revolute({
    id: asmId,
    name: 'BadReorient',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2, reorient: '45' },
  })
  console.log('[07] reorient=45 (invalid): result=', rBad.result, 'maxLevel:', rBad.maxLevel)
  filewrite({ result: rBad.result, messages: rBad.messages, maxLevel: rBad.maxLevel }, 'bad-reorient')

  return { asmId }
}
