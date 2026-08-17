// Test: multiple sketches on the same work plane
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result

  // Create a work plane
  const wpId = (await api.v1.part.workPlane({
    id: partId,
    name: 'SharedPlane',
    normal: [0, 0, 1],
    position: [0, 0, 0],
  })).result
  console.log('[18] workPlane:', wpId)

  // Create two sketches on the same plane
  const sk1 = await api.v1.sketch.create({ id: partId, planeId: wpId, name: 'Sk1OnPlane' })
  const sk2 = await api.v1.sketch.create({ id: partId, planeId: wpId, name: 'Sk2OnPlane' })

  console.log('[18] sketch1:', sk1.result, 'maxLevel:', sk1.maxLevel)
  console.log('[18] sketch2:', sk2.result, 'maxLevel:', sk2.maxLevel)
  console.log('[18] both succeeded:', sk1.maxLevel <= 31 && sk2.maxLevel <= 31)

  filewrite({
    wpId,
    sketch1: sk1.result,
    sketch2: sk2.result,
    bothOk: sk1.maxLevel <= 31 && sk2.maxLevel <= 31,
  }, 'multiple-on-same-plane')

  return { partId }
}
