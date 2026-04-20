export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TwistAngles' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  // Helper: create a new sketch with an L-shaped profile for visible twisting
  async function makeProfile(name, offsetX) {
    const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
    const ids = (await api.v1.sketch.rectangle({
      id: skId, startPos: [offsetX - 20, -15, 0], endPos: [offsetX + 20, 15, 0]
    })).result
    const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: ids })).result
    return regionId
  }

  // Test different twist angles
  const r1 = await api.v1.part.twist({
    id: partId, name: 'Twist-PI/4', references: [await makeProfile('A', -70)],
    twistAngle: Math.PI / 4, limit2: 100,
  })
  console.log('[02] twist PI/4:', r1.result, 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.part.twist({
    id: partId, name: 'Twist-PI/2', references: [await makeProfile('B', 0)],
    twistAngle: Math.PI / 2, limit2: 100,
  })
  console.log('[02] twist PI/2:', r2.result, 'maxLevel:', r2.maxLevel)

  const r3 = await api.v1.part.twist({
    id: partId, name: 'Twist-PI', references: [await makeProfile('C', 70)],
    twistAngle: Math.PI, limit2: 100,
  })
  console.log('[02] twist PI:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    piOver4: { id: r1.result, maxLevel: r1.maxLevel, msgs: r1.messages },
    piOver2: { id: r2.result, maxLevel: r2.maxLevel, msgs: r2.messages },
    pi: { id: r3.result, maxLevel: r3.maxLevel, msgs: r3.messages },
  }, 'twist-angles-response')

  await snapshot('twist-angles')

  return { partId }
}
