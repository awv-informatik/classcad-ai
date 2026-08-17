// L-shape profile + offset originPos (axis not at world origin)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LShapeOffset' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // L-shaped profile for more complex revolve
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'LShape' })).result
  await api.v1.curve.advancedPolyline({
    id: s1,
    pld: [
      { xa: 30, ya: 0 },
      { xa: 50, ya: 0 },
      { xa: 50, ya: 5 },
      { xa: 35, ya: 5 },
      { xa: 35, ya: 20 },
      { xa: 30, ya: 20 },
    ],
    close: true,
  })

  const r1 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0],
    angle: Math.PI * 2, curves: s1,
  })
  console.log('[13] L-shape revolve:', r1.result, 'maxLevel:', r1.maxLevel)

  // Revolve with originPos offset from world origin
  // Profile at x=20-35, axis at x=10 (10 units away from profile edge)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Offset' })).result
  await api.v1.curve.advancedPolyline({
    id: s2,
    pld: [
      { xa: 20, ya: 40 }, { xa: 35, ya: 40 },
      { xa: 35, ya: 50 }, { xa: 20, ya: 50 },
    ],
    close: true,
  })

  const r2 = await api.v1.solid.revolve({
    id: eifId,
    originPos: [10, 40, 0],  // axis at x=10, offset from 0
    direction: [0, 1, 0],
    angle: Math.PI,  // half revolve to see the offset
    curves: s2,
  })
  console.log('[13] offset origin revolve:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    lShape: { result: r1.result, maxLevel: r1.maxLevel },
    offsetOrigin: { result: r2.result, maxLevel: r2.maxLevel },
  }, 'l-shape-offset-results')

  await snapshot('l-shape-and-offset')
  return { partId }
}
