// Circle profile retry — try passing circle element ID in array instead of shape ID
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CircleFix' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create circle in a shape
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'CircProf' })).result
  const circResult = await api.v1.curve.circle({
    id: shapeId,
    center: [45, 0, 0],
    radius: 8,
  })
  console.log('[10] circle result:', circResult.result, 'maxLevel:', circResult.maxLevel)

  // Attempt 1: pass shape ID (same as before but with logging)
  const r1 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0],
    angle: Math.PI * 2, curves: shapeId,
  })
  console.log('[10] curves=shapeId:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[10] msg:', r1.messages[0].message.substring(0, 100))

  // Attempt 2: pass circle element ID as array
  if (circResult.result) {
    const r2 = await api.v1.solid.revolve({
      id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0],
      angle: Math.PI * 2, curves: [circResult.result],
    })
    console.log('[10] curves=[circId]:', r2.result, 'maxLevel:', r2.maxLevel)
    if (r2.messages?.length) console.log('[10] msg:', r2.messages[0].message.substring(0, 100))
  }

  // Attempt 3: use advancedPolyline circle approximation instead
  const shapeId2 = (await api.v1.curve.shape({ id: eifId, name: 'ArcProf' })).result
  // Create a rough circle using arcs in advancedPolyline
  await api.v1.curve.advancedPolyline({
    id: shapeId2,
    pld: [
      { xa: 45, ya: -8 },
      { xa: 53, ya: 0, r: 8 },
      { xa: 45, ya: 8, r: 8 },
      { xa: 37, ya: 0, r: 8 },
    ],
    close: true,
  })

  const r3 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0],
    angle: Math.PI * 2, curves: shapeId2,
  })
  console.log('[10] advancedPolyline circle:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    shapeId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    elementId: circResult.result ? 'attempted' : 'no circle ID',
    polyCircle: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'circle-fix-results')

  if (r3.result) await snapshot('circle-fix')
  return { partId }
}
