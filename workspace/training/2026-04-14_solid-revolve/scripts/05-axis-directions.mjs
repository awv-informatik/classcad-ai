// Test revolve around different axes: X, Y, Z, and arbitrary diagonal
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AxisTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  async function makeProfile(name, x1, y1, x2, y2) {
    const shapeId = (await api.v1.curve.shape({ id: eifId, name })).result
    await api.v1.curve.advancedPolyline({
      id: shapeId,
      pld: [
        { xa: x1, ya: y1 }, { xa: x2, ya: y1 },
        { xa: x2, ya: y2 }, { xa: x1, ya: y2 },
      ],
      close: true,
    })
    return shapeId
  }

  // Around X axis — profile in XY, rotated around X
  const s1 = await makeProfile('AxisX', 0, 30, 10, 40)
  const r1 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 0, 0], direction: [1, 0, 0],
    angle: Math.PI * 2, curves: s1,
  })
  console.log('[05] X-axis revolve:', r1.result, 'maxLevel:', r1.maxLevel)

  // Around Z axis — profile in XY, rotated around Z
  const s2 = await makeProfile('AxisZ', 40, 0, 55, 10)
  const r2 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 0, 0], direction: [0, 0, 1],
    angle: Math.PI * 2, curves: s2,
  })
  console.log('[05] Z-axis revolve:', r2.result, 'maxLevel:', r2.maxLevel)

  // Around diagonal axis [1,1,0]
  const s3 = await makeProfile('AxisDiag', 40, 40, 50, 50)
  const r3 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 0, 0], direction: [1, 1, 0],
    angle: Math.PI * 2, curves: s3,
  })
  console.log('[05] diagonal axis revolve:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    xAxis: { result: r1.result, maxLevel: r1.maxLevel },
    zAxis: { result: r2.result, maxLevel: r2.maxLevel },
    diagonal: { result: r3.result, maxLevel: r3.maxLevel },
  }, 'axis-results')

  await snapshot('axis-directions')
  return { partId }
}
