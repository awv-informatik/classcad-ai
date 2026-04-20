export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeCases' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  async function makeProfile() {
    const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
    const ids = (await api.v1.sketch.rectangle({
      id: skId, startPos: [-20, -15, 0], endPos: [20, 15, 0]
    })).result
    return (await api.v1.sketch.sketchRegion({ id: skId, geomIds: ids })).result
  }

  // limit2=0 — should fail
  const r1 = await api.v1.part.twist({
    id: partId, name: 'ZeroLimit', references: [await makeProfile()],
    twistAngle: Math.PI / 4, limit2: 0,
  })
  console.log('[14] limit2=0:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages) r1.messages.forEach(m => console.log('[14]   msg:', m.level, m.code, m.message))

  // Empty references
  const r2 = await api.v1.part.twist({
    id: partId, name: 'EmptyRefs', references: [],
    twistAngle: Math.PI / 4, limit2: 80,
  })
  console.log('[14] empty refs:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages) r2.messages.forEach(m => console.log('[14]   msg:', m.level, m.code, m.message))

  // Very large angle (4π = 2 full rotations)
  const r3 = await api.v1.part.twist({
    id: partId, name: 'BigAngle', references: [await makeProfile()],
    twistAngle: 4 * Math.PI, limit2: 100,
  })
  console.log('[14] 4π angle:', r3.result, 'maxLevel:', r3.maxLevel)

  // Negative limit2
  const r4 = await api.v1.part.twist({
    id: partId, name: 'NegLimit', references: [await makeProfile()],
    twistAngle: Math.PI / 4, limit2: -50,
  })
  console.log('[14] limit2=-50:', r4.result, 'maxLevel:', r4.maxLevel)

  filewrite({
    zeroLimit: { id: r1.result, maxLevel: r1.maxLevel, msgs: r1.messages },
    emptyRefs: { id: r2.result, maxLevel: r2.maxLevel, msgs: r2.messages },
    bigAngle: { id: r3.result, maxLevel: r3.maxLevel, msgs: r3.messages },
    negLimit: { id: r4.result, maxLevel: r4.maxLevel, msgs: r4.messages },
  }, 'edge-cases-response')

  if (r3.maxLevel <= 31) await snapshot('big-angle')
  if (r4.maxLevel <= 31) await snapshot('neg-limit')

  return { partId }
}
