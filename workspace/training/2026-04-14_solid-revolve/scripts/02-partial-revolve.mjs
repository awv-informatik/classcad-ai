// Partial revolve — 90°, 180°, 270° angles
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PartialRevolve' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Helper: create rectangular profile shape
  async function makeProfile(name, x1, y1, x2, y2) {
    const shapeId = (await api.v1.curve.shape({ id: eifId, name })).result
    await api.v1.curve.advancedPolyline({
      id: shapeId,
      pld: [
        { xa: x1, ya: y1 },
        { xa: x2, ya: y1 },
        { xa: x2, ya: y2 },
        { xa: x1, ya: y2 },
      ],
      close: true,
    })
    return shapeId
  }

  // 90° revolve around Y axis
  const s1 = await makeProfile('Prof90', 40, 0, 55, 15)
  const r1 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0],
    angle: Math.PI / 2, curves: s1,
  })
  console.log('[02] 90° revolve:', r1.result, 'maxLevel:', r1.maxLevel)

  // 180° revolve — offset in Y to separate
  const s2 = await makeProfile('Prof180', 40, 30, 55, 45)
  const r2 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 30, 0], direction: [0, 1, 0],
    angle: Math.PI, curves: s2,
  })
  console.log('[02] 180° revolve:', r2.result, 'maxLevel:', r2.maxLevel)

  // 270° revolve — offset in Y again
  const s3 = await makeProfile('Prof270', 40, 60, 55, 75)
  const r3 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 60, 0], direction: [0, 1, 0],
    angle: Math.PI * 1.5, curves: s3,
  })
  console.log('[02] 270° revolve:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    r90: { result: r1.result, maxLevel: r1.maxLevel },
    r180: { result: r2.result, maxLevel: r2.maxLevel },
    r270: { result: r3.result, maxLevel: r3.maxLevel },
  }, 'partial-results')

  await snapshot('partial-revolves')
  return { partId }
}
