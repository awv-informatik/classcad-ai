export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const instRef = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Ref',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Ref',
    mate1: { path: [instRef], csys: wcs }, xOffset: 100,
  })

  const instTarget = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Target',
  })).result
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Target',
    mate1: { path: [instTarget], csys: wcs },
  })).result

  // Baseline: no offsets, no rotations, flip=Z, reorient=0
  const cogBase = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result?.cog
  console.log('[11] baseline COG:', JSON.stringify(cogBase))

  // Combined update: flip + reorient + offsets + rotation all at once
  await api.v1.assembly.updateFastenedOrigin({
    id: foId,
    mate1: { flip: '-Z', reorient: '90' },
    xOffset: 50,
    yOffset: 30,
    zRotation: '90deg',
  })

  const cogCombined = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result?.cog
  console.log('[11] combined COG:', JSON.stringify(cogCombined))
  await snapshot('combined-update')

  const state = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Target' })).result
  console.log('[11] state:', JSON.stringify({
    flip: state?.mate1?.flip,
    reorient: state?.mate1?.reorient,
    xOffset: state?.xOffset,
    yOffset: state?.yOffset,
    zRotation: state?.zRotation,
  }))

  // Now update only offset, keeping flip/reorient/rotation
  await api.v1.assembly.updateFastenedOrigin({ id: foId, xOffset: 0, yOffset: 0 })
  const cogAfterPartial = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result?.cog
  console.log('[11] after zeroing offsets COG:', JSON.stringify(cogAfterPartial))

  const stateAfterPartial = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Target' })).result
  console.log('[11] partial state:', JSON.stringify({
    flip: stateAfterPartial?.mate1?.flip,
    reorient: stateAfterPartial?.mate1?.reorient,
    xOffset: stateAfterPartial?.xOffset,
    yOffset: stateAfterPartial?.yOffset,
    zRotation: stateAfterPartial?.zRotation,
  }))

  filewrite({
    cogBase, cogCombined, cogAfterPartial,
    stateCombined: state,
    stateAfterPartial,
  }, 'combined-results')

  return { foId }
}
