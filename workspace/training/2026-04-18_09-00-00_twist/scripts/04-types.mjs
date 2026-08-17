export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TwistTypes' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  async function makeProfile(offsetX) {
    const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
    const ids = (await api.v1.sketch.rectangle({
      id: skId, startPos: [offsetX - 15, -10, 0], endPos: [offsetX + 15, 10, 0]
    })).result
    return (await api.v1.sketch.sketchRegion({ id: skId, geomIds: ids })).result
  }

  // UP (default) — extrudes along +Z
  const rUp = await api.v1.part.twist({
    id: partId, name: 'TwistUP', references: [await makeProfile(-50)],
    type: 'UP', twistAngle: Math.PI / 2, limit2: 80,
  })
  console.log('[04] UP:', rUp.result, 'maxLevel:', rUp.maxLevel)

  // DOWN — extrudes along -Z
  const rDown = await api.v1.part.twist({
    id: partId, name: 'TwistDOWN', references: [await makeProfile(0)],
    type: 'DOWN', twistAngle: Math.PI / 2, limit2: 80,
  })
  console.log('[04] DOWN:', rDown.result, 'maxLevel:', rDown.maxLevel)

  // SYMMETRIC — both directions
  const rSym = await api.v1.part.twist({
    id: partId, name: 'TwistSYM', references: [await makeProfile(50)],
    type: 'SYMMETRIC', twistAngle: Math.PI / 2, limit2: 80,
  })
  console.log('[04] SYMMETRIC:', rSym.result, 'maxLevel:', rSym.maxLevel)

  filewrite({
    up: { id: rUp.result, maxLevel: rUp.maxLevel, msgs: rUp.messages },
    down: { id: rDown.result, maxLevel: rDown.maxLevel, msgs: rDown.messages },
    symmetric: { id: rSym.result, maxLevel: rSym.maxLevel, msgs: rSym.messages },
  }, 'types-response')

  await snapshot('types')

  return { partId }
}
