export default async function (api, { snapshot, filewrite }) {
  // Test A: translate with isGlobal=TRUE after OCS rotation
  const partId = (await api.v1.part.create({ name: 'IsGlobalCompA' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const box1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 20, height: 30 })).result

  // Set OCS to rotate 90° around Z
  await api.v1.common.setObjectCoordSystem({
    id: box1,
    origin: [0, 0, 0],
    xVec: [0, 1, 0],
    yVec: [-1, 0, 0],
  })

  // Translate [50,0,0] with isGlobal=TRUE
  await api.v1.common.transformObjectWithMatrix({
    id: box1,
    matrix: [
      [1, 0, 0, 50],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
    isGlobal: true,
  })

  const stepA = await api.v1.common.save({ format: 'STP' })
  filewrite(stepA.result.content, 'step-A-global')

  // Test B: translate with isGlobal=FALSE after OCS rotation
  const partId2 = (await api.v1.part.create({ name: 'IsGlobalCompB' })).result
  const eifId2 = (await api.v1.part.entityInjection({ id: partId2, name: 'EIF1' })).result
  const box2 = (await api.v1.solid.box({ id: eifId2, length: 60, width: 20, height: 30 })).result

  // Set same OCS rotation
  await api.v1.common.setObjectCoordSystem({
    id: box2,
    origin: [0, 0, 0],
    xVec: [0, 1, 0],
    yVec: [-1, 0, 0],
  })

  // Translate [50,0,0] with isGlobal=FALSE
  await api.v1.common.transformObjectWithMatrix({
    id: box2,
    matrix: [
      [1, 0, 0, 50],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
    isGlobal: false,
  })

  const stepB = await api.v1.common.save({ format: 'STP' })
  filewrite(stepB.result.content, 'step-B-local')

  // Compare
  const aPts = stepA.result.content.match(/CARTESIAN_POINT\('',\s*\(([^)]+)\)/g)
  const bPts = stepB.result.content.match(/CARTESIAN_POINT\('',\s*\(([^)]+)\)/g)

  console.log('[16] A (global) first point:', aPts?.[0])
  console.log('[16] B (local)  first point:', bPts?.[0])
  console.log('[16] Same?', aPts?.[0] === bPts?.[0])

  return { partId }
}
