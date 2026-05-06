export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  // Non-symmetric box to make flip effects visible: 40x30x20
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Reference instance at X=100 (fixed, never moves)
  const instRef = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Ref',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Ref',
    mate1: { path: [instRef], csys: wcs },
    xOffset: 100,
  })

  // Target instance at Y=60
  const instTarget = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Target',
  })).result
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Target',
    mate1: { path: [instTarget], csys: wcs },
    yOffset: 60,
  })).result

  // Template local COG = [20, 15, 10] (box centered in part space: 40/2, 30/2, 20/2)
  // Ref at xOffset=100: world COG = [120, 15, 10]
  // Target at yOffset=60: world COG depends on flip

  const results = {}

  // flip Z (default) — no rotation, target COG = [20, 75, 10]
  const cogZ = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] flip Z   COG:', JSON.stringify(cogZ?.cog))
  results.flipZ = cogZ?.cog
  await snapshot('flip-Z')

  // flip -Z — 180° around Y axis: target local COG goes [20,15,10] → [-20,15,-10]
  // world = [-20+0, 15+60, -10+0] = [-20, 75, -10]
  await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { flip: '-Z' } })
  const cogNegZ = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] flip -Z  COG:', JSON.stringify(cogNegZ?.cog))
  results.flipNegZ = cogNegZ?.cog
  await snapshot('flip-neg-Z')

  // flip X — 90° around Y: target local COG goes [20,15,10] → [10,15,-20]
  // world = [10, 75, -20]
  await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { flip: 'X' } })
  const cogX = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] flip X   COG:', JSON.stringify(cogX?.cog))
  results.flipX = cogX?.cog
  await snapshot('flip-X')

  // flip -X — -90° around Y
  await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { flip: '-X' } })
  const cogNegX = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] flip -X  COG:', JSON.stringify(cogNegX?.cog))
  results.flipNegX = cogNegX?.cog

  // flip Y — 90° around X
  await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { flip: 'Y' } })
  const cogY = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] flip Y   COG:', JSON.stringify(cogY?.cog))
  results.flipY = cogY?.cog

  // flip -Y — -90° around X
  await api.v1.assembly.updateFastenedOrigin({ id: foId, mate1: { flip: '-Y' } })
  const cogNegY = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] flip -Y  COG:', JSON.stringify(cogNegY?.cog))
  results.flipNegY = cogNegY?.cog

  // Verify state preserved yOffset
  const finalState = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Target' })).result
  console.log('[04] final state: flip=%s yOffset=%d', finalState?.mate1?.flip, finalState?.yOffset)
  results.finalState = finalState

  filewrite(results, 'flip-results')
  return { foId }
}
