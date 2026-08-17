// Edge case angles: 0, negative, > 2*PI
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeAngles' })).result
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

  // angle = 0
  const s1 = await makeProfile('Zero', 40, 0, 55, 15)
  const r1 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0],
    angle: 0, curves: s1,
  })
  console.log('[03] angle=0:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[03] angle=0 messages:', JSON.stringify(r1.messages))

  // negative angle (-PI/2 = -90°)
  const s2 = await makeProfile('Neg', 40, 30, 55, 45)
  const r2 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 30, 0], direction: [0, 1, 0],
    angle: -Math.PI / 2, curves: s2,
  })
  console.log('[03] angle=-90°:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[03] angle=-90° messages:', JSON.stringify(r2.messages))

  // angle > 2*PI (e.g. 3*PI)
  const s3 = await makeProfile('Over', 40, 60, 55, 75)
  const r3 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 60, 0], direction: [0, 1, 0],
    angle: Math.PI * 3, curves: s3,
  })
  console.log('[03] angle=3*PI:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[03] angle=3*PI messages:', JSON.stringify(r3.messages))

  // very small angle (0.01 radians ≈ 0.57°)
  const s4 = await makeProfile('Tiny', 40, 90, 55, 105)
  const r4 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 90, 0], direction: [0, 1, 0],
    angle: 0.01, curves: s4,
  })
  console.log('[03] angle=0.01:', r4.result, 'maxLevel:', r4.maxLevel)

  filewrite({
    zero: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    negative: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    over2pi: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    tiny: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'edge-angle-results')

  await snapshot('edge-angles')
  return { partId }
}
