export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Two instances: fixed ref at X=100, target at origin
  const instRef = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Ref',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const instTarget = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Target',
  })).result

  // Fix ref instance
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Ref',
    mate1: { path: [instRef], csys: wcs },
    xOffset: 100,
  })

  // Create fastenedOrigin on target with default flip='Z'
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Target',
    mate1: { path: [instTarget], csys: wcs },
    xOffset: 0, yOffset: 50,
  })).result
  console.log('[02] foId:', foId)

  const cogBefore = (await api.v1.part.calculateMassProperties({ id: asmId })).result
  console.log('[02] COG before flip update:', JSON.stringify(cogBefore?.centerOfGravity))
  await snapshot('before-flip-update')

  // Get state before
  const stateBefore = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Target' })).result
  console.log('[02] state before:', JSON.stringify({ flip: stateBefore?.mate1?.flip, reorient: stateBefore?.mate1?.reorient }))

  // Update flip to '-Z' (should flip the instance)
  const upR = await api.v1.assembly.updateFastenedOrigin({
    id: foId, mate1: { flip: '-Z' },
  })
  console.log('[02] update flip result:', upR.result, 'maxLevel:', upR.maxLevel)
  if (upR.messages?.length) console.log('[02] messages:', JSON.stringify(upR.messages))

  const cogAfter = (await api.v1.part.calculateMassProperties({ id: asmId })).result
  console.log('[02] COG after flip -Z:', JSON.stringify(cogAfter?.centerOfGravity))
  await snapshot('after-flip-Z-neg')

  const stateAfter = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Target' })).result
  console.log('[02] state after:', JSON.stringify(stateAfter))

  // Update flip to 'X'
  const upR2 = await api.v1.assembly.updateFastenedOrigin({
    id: foId, mate1: { flip: 'X' },
  })
  console.log('[02] update flip X result:', upR2.result, 'maxLevel:', upR2.maxLevel)
  if (upR2.messages?.length) console.log('[02] messages:', JSON.stringify(upR2.messages))

  const cogFlipX = (await api.v1.part.calculateMassProperties({ id: asmId })).result
  console.log('[02] COG after flip X:', JSON.stringify(cogFlipX?.centerOfGravity))
  await snapshot('after-flip-X')

  filewrite({
    cogBefore: cogBefore?.centerOfGravity,
    cogAfterFlipNegZ: cogAfter?.centerOfGravity,
    cogAfterFlipX: cogFlipX?.centerOfGravity,
    stateBefore: stateBefore,
    stateAfterFlipNegZ: stateAfter,
    updateFlipResult: upR.result,
    updateFlipMaxLevel: upR.maxLevel,
  }, 'flip-update')

  return { foId }
}
