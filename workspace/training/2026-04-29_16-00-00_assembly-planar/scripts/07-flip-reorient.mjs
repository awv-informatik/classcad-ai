export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'PlanarFlip' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'Plate', length: 100, width: 80, height: 10 })
  const wcs1 = (await api.v1.part.workCSys({
    id: tpl1, name: 'Ref', origin: [50, 40, 10],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'ArmBox', length: 60, width: 20, height: 15 })
  const wcs2 = (await api.v1.part.workCSys({
    id: tpl2, name: 'Ref', origin: [30, 10, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId })).result

  // Test each flip value on mate2
  const flips = ['Z', '-Z', 'X', '-X', 'Y', '-Y']
  for (const flip of flips) {
    const r = await api.v1.assembly.planar({
      id: asmId,
      name: `Flip_${flip}`,
      mate1: { path: [inst1], csys: wcs1 },
      mate2: { path: [inst2], csys: wcs2, flip },
    })
    console.log(`[07] flip=${flip}: result=${r.result} maxLevel=${r.maxLevel}`)
  }

  // Test each reorient value on mate2
  const reorients = ['0', '90', '180', '270']
  for (const reorient of reorients) {
    const r = await api.v1.assembly.planar({
      id: asmId,
      name: `Reorient_${reorient}`,
      mate1: { path: [inst1], csys: wcs1 },
      mate2: { path: [inst2], csys: wcs2, reorient },
    })
    console.log(`[07] reorient=${reorient}: result=${r.result} maxLevel=${r.maxLevel}`)
  }

  // Invalid flip
  const rBadFlip = await api.v1.assembly.planar({
    id: asmId,
    name: 'BadFlip',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2, flip: 'INVALID' },
  })
  console.log('[07] invalid flip:', rBadFlip.result, 'maxLevel:', rBadFlip.maxLevel)
  if (rBadFlip.messages?.length) console.log('[07] bad flip msgs:', JSON.stringify(rBadFlip.messages))

  // Invalid reorient
  const rBadReorient = await api.v1.assembly.planar({
    id: asmId,
    name: 'BadReorient',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2, reorient: '45' },
  })
  console.log('[07] invalid reorient:', rBadReorient.result, 'maxLevel:', rBadReorient.maxLevel)
  if (rBadReorient.messages?.length) console.log('[07] bad reorient msgs:', JSON.stringify(rBadReorient.messages))

  filewrite({ badFlip: { result: rBadFlip.result, messages: rBadFlip.messages }, badReorient: { result: rBadReorient.result, messages: rBadReorient.messages } }, 'flip-reorient-errors')

  await snapshot('flip-reorient')
  return {}
}
