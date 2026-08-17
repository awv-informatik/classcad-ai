// What happens when the profile intersects the revolve axis?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ProfileOnAxis' })).result
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

  // Profile centered on Y axis (crosses through axis)
  // Rectangle from x=-10 to x=10 — the axis at x=0 passes through the middle
  const s1 = await makeProfile('Crossing', -10, 0, 10, 15)
  const r1 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0],
    angle: Math.PI * 2, curves: s1,
  })
  console.log('[06] profile crossing axis:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[06] crossing messages:', JSON.stringify(r1.messages))

  // Profile touching axis (starts at x=0)
  const s2 = await makeProfile('Touching', 0, 30, 15, 45)
  const r2 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 30, 0], direction: [0, 1, 0],
    angle: Math.PI * 2, curves: s2,
  })
  console.log('[06] profile touching axis:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[06] touching messages:', JSON.stringify(r2.messages))

  filewrite({
    crossing: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    touching: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'axis-intersection-results')

  await snapshot('profile-on-axis')
  return { partId }
}
