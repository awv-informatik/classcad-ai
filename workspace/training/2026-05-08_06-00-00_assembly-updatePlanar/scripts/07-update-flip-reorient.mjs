export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 100, width: 80, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Slider' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 60, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Slider' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create planar with default flip='Z', locked rotation so reorient is visible
  const planarId = (await api.v1.assembly.planar({
    id: asmId,
    name: 'TestPlanar',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 12,
    zRotationLimits: { min: 0, max: 0 },
  })).result

  const cogDefault = (await api.v1.part.calculateMassProperties({ id: inst2 })).result.cog
  console.log('[07] COG default flip Z:', JSON.stringify(cogDefault))
  await snapshot('default-flip-Z')

  // Update mate2 flip to '-Z'
  const r1 = await api.v1.assembly.updatePlanar({ id: planarId, mate2: { path: [inst2], csys: wcsB, flip: '-Z' } })
  console.log('[07] update flip -Z result:', r1.result, 'maxLevel:', r1.maxLevel)

  const cogFlipNZ = (await api.v1.part.calculateMassProperties({ id: inst2 })).result.cog
  console.log('[07] COG flip -Z:', JSON.stringify(cogFlipNZ))
  await snapshot('flip-neg-Z')

  // Update mate2 reorient to '90' (still with locked rotation)
  const r2 = await api.v1.assembly.updatePlanar({ id: planarId, mate2: { path: [inst2], csys: wcsB, flip: 'Z', reorient: '90' } })
  console.log('[07] update reorient 90 result:', r2.result, 'maxLevel:', r2.maxLevel)

  const cogReorient = (await api.v1.part.calculateMassProperties({ id: inst2 })).result.cog
  console.log('[07] COG reorient 90:', JSON.stringify(cogReorient))
  await snapshot('reorient-90')

  // Verify via getPlanar
  const getR = await api.v1.assembly.getPlanar({ id: asmId, name: 'TestPlanar' })
  console.log('[07] getPlanar mate2 flip:', getR.result.mate2.flip, 'reorient:', getR.result.mate2.reorient)

  filewrite({
    cogDefault,
    cogFlipNZ,
    cogReorient,
    getPlanarMate2: getR.result.mate2,
  }, 'flip-reorient-update')

  return { planarId }
}
