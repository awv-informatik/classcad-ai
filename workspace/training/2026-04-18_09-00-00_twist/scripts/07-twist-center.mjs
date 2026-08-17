export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TwistCenter' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  async function makeProfile(offsetX) {
    const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
    const ids = (await api.v1.sketch.rectangle({
      id: skId, startPos: [offsetX - 15, -10, 0], endPos: [offsetX + 15, 10, 0]
    })).result
    return (await api.v1.sketch.sketchRegion({ id: skId, geomIds: ids })).result
  }

  // Default twistCenter [0,0,0] — twist axis passes through origin
  const r1 = await api.v1.part.twist({
    id: partId, name: 'CenterOrigin', references: [await makeProfile(-50)],
    type: 'CUSTOM', twistAngle: Math.PI / 2, limit2: 80,
    twistCenter: [0, 0, 0], direction: [0, 0, 1],
  })
  console.log('[07] center=[0,0,0]:', r1.result, 'maxLevel:', r1.maxLevel)

  // Offset twistCenter — twist axis shifted from origin
  const r2 = await api.v1.part.twist({
    id: partId, name: 'CenterOffset', references: [await makeProfile(50)],
    type: 'CUSTOM', twistAngle: Math.PI / 2, limit2: 80,
    twistCenter: [50, 0, 0], direction: [0, 0, 1],
  })
  console.log('[07] center=[50,0,0]:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    origin: { id: r1.result, maxLevel: r1.maxLevel, msgs: r1.messages },
    offset: { id: r2.result, maxLevel: r2.maxLevel, msgs: r2.messages },
  }, 'twist-center-response')

  await snapshot('twist-center')

  return { partId }
}
