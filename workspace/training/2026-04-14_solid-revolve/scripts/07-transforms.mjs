// Test optional transform params: translation, rotation, rotateFirst
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TransformTest' })).result
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

  // Base revolve — no transforms (reference)
  const s1 = await makeProfile('Base', 30, 0, 40, 10)
  const r1 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0],
    angle: Math.PI / 2, curves: s1,
  })
  console.log('[07] base (no transforms):', r1.result, 'maxLevel:', r1.maxLevel)

  // With translation [50, 0, 0]
  const s2 = await makeProfile('Translated', 30, 0, 40, 10)
  const r2 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0],
    angle: Math.PI / 2, curves: s2,
    translation: [50, 0, 0],
  })
  console.log('[07] with translation:', r2.result, 'maxLevel:', r2.maxLevel)

  // With rotation [0, 0, PI/4] (45° around Z)
  const s3 = await makeProfile('Rotated', 30, 0, 40, 10)
  const r3 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0],
    angle: Math.PI / 2, curves: s3,
    rotation: [0, 0, Math.PI / 4],
  })
  console.log('[07] with rotation:', r3.result, 'maxLevel:', r3.maxLevel)

  // With both translation + rotation, rotateFirst=TRUE (default)
  const s4 = await makeProfile('Both_RotFirst', 30, 0, 40, 10)
  const r4 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0],
    angle: Math.PI / 2, curves: s4,
    translation: [50, 0, 0],
    rotation: [0, 0, Math.PI / 4],
    rotateFirst: true,
  })
  console.log('[07] rot+trans rotateFirst=true:', r4.result, 'maxLevel:', r4.maxLevel)

  // rotateFirst=FALSE
  const s5 = await makeProfile('Both_TransFirst', 30, 0, 40, 10)
  const r5 = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0],
    angle: Math.PI / 2, curves: s5,
    translation: [50, 0, 0],
    rotation: [0, 0, Math.PI / 4],
    rotateFirst: false,
  })
  console.log('[07] rot+trans rotateFirst=false:', r5.result, 'maxLevel:', r5.maxLevel)

  filewrite({
    base: { result: r1.result, maxLevel: r1.maxLevel },
    translated: { result: r2.result, maxLevel: r2.maxLevel },
    rotated: { result: r3.result, maxLevel: r3.maxLevel },
    bothRotFirst: { result: r4.result, maxLevel: r4.maxLevel },
    bothTransFirst: { result: r5.result, maxLevel: r5.maxLevel },
  }, 'transform-results')

  await snapshot('transforms')
  return { partId }
}
