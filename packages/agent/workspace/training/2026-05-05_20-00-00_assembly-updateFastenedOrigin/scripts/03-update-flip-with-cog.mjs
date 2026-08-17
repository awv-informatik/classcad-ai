export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Reference instance far away at X=100 (fixed)
  const instRef = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Ref',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Ref',
    mate1: { path: [instRef], csys: wcs },
    xOffset: 100,
  })

  // Target instance at Y=60 with default flip='Z'
  const instTarget = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Target',
  })).result
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Target',
    mate1: { path: [instTarget], csys: wcs },
    yOffset: 60,
  })).result

  // Measure COG with flip='Z' (default)
  const cogFlipZ = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] COG flip Z:', JSON.stringify(cogFlipZ?.centerOfGravity))
  await snapshot('flip-Z-default')

  // Update flip to '-Z'
  await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { flip: '-Z' } })
  const cogFlipNegZ = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] COG flip -Z:', JSON.stringify(cogFlipNegZ?.centerOfGravity))
  await snapshot('flip-neg-Z')

  // Update flip to 'X'
  await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { flip: 'X' } })
  const cogFlipX = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] COG flip X:', JSON.stringify(cogFlipX?.centerOfGravity))
  await snapshot('flip-X')

  // Update flip to '-X'
  await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { flip: '-X' } })
  const cogFlipNegX = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] COG flip -X:', JSON.stringify(cogFlipNegX?.centerOfGravity))

  // Update flip to 'Y'
  await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { flip: 'Y' } })
  const cogFlipY = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] COG flip Y:', JSON.stringify(cogFlipY?.centerOfGravity))

  // Update flip to '-Y'
  await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { flip: '-Y' } })
  const cogFlipNegY = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[03] COG flip -Y:', JSON.stringify(cogFlipNegY?.centerOfGravity))

  // Verify state preserved yOffset and other params
  const finalState = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Target' })).result
  console.log('[03] final state flip:', finalState?.mate1?.flip, 'yOffset:', finalState?.yOffset)

  filewrite({
    cogFlipZ: cogFlipZ?.centerOfGravity,
    cogFlipNegZ: cogFlipNegZ?.centerOfGravity,
    cogFlipX: cogFlipX?.centerOfGravity,
    cogFlipNegX: cogFlipNegX?.centerOfGravity,
    cogFlipY: cogFlipY?.centerOfGravity,
    cogFlipNegY: cogFlipNegY?.centerOfGravity,
    finalState,
  }, 'flip-cog')

  return { foId }
}
