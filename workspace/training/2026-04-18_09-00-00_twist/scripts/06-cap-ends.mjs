export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CapEnds' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  async function makeProfile(offsetX) {
    const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
    const ids = (await api.v1.sketch.rectangle({
      id: skId, startPos: [offsetX - 20, -15, 0], endPos: [offsetX + 20, 15, 0]
    })).result
    return (await api.v1.sketch.sketchRegion({ id: skId, geomIds: ids })).result
  }

  // capEnds = TRUE (default) — solid body
  const r1 = await api.v1.part.twist({
    id: partId, name: 'Solid', references: [await makeProfile(-50)],
    twistAngle: Math.PI / 2, limit2: 80, capEnds: 1,
  })
  console.log('[06] capEnds=1:', r1.result, 'maxLevel:', r1.maxLevel)

  // capEnds = FALSE — sheet body (no caps)
  const r2 = await api.v1.part.twist({
    id: partId, name: 'Sheet', references: [await makeProfile(50)],
    twistAngle: Math.PI / 2, limit2: 80, capEnds: 0,
  })
  console.log('[06] capEnds=0:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    solid: { id: r1.result, maxLevel: r1.maxLevel, msgs: r1.messages },
    sheet: { id: r2.result, maxLevel: r2.maxLevel, msgs: r2.messages },
  }, 'cap-ends-response')

  await snapshot('cap-ends')

  return { partId }
}
