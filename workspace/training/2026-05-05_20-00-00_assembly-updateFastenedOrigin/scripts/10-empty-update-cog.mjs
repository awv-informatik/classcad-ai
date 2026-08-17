export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const instA = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'A',
  })).result
  const instB = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'B',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_A', mate1: { path: [instA], csys: wcs },
  })
  const foB = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_B',
    mate1: { path: [instB], csys: wcs },
    xOffset: 80, yOffset: 30, zRotation: '45deg',
  })).result

  // COG before empty update
  const cogBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result?.cog
  console.log('[10] COG before:', JSON.stringify(cogBefore))
  const stateBefore = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_B' })).result

  // Empty update: just { id }
  const emptyR = await api.v1.assembly.updateFastenedOrigin({ id: foB })
  console.log('[10] empty result:', emptyR.result, 'maxLevel:', emptyR.maxLevel)

  // COG after empty update
  const cogAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result?.cog
  console.log('[10] COG after:', JSON.stringify(cogAfter))
  const stateAfter = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_B' })).result

  console.log('[10] COG changed:', JSON.stringify(cogBefore) !== JSON.stringify(cogAfter))
  console.log('[10] state changed:', JSON.stringify(stateBefore) !== JSON.stringify(stateAfter))

  filewrite({
    cogBefore, cogAfter,
    stateBefore, stateAfter,
    cogEqual: JSON.stringify(cogBefore) === JSON.stringify(cogAfter),
    stateEqual: JSON.stringify(stateBefore) === JSON.stringify(stateAfter),
  }, 'empty-update-cog')

  return { foB }
}
