// Test extrusion with rotation, translation, rotateFirst params
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TransformTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  async function makeProfile(name) {
    const shapeId = (await api.v1.curve.shape({ id: eifId, name })).result
    await api.v1.curve.advancedPolyline({
      id: shapeId,
      pld: [
        { xa: 0, ya: 0 },
        { xa: 30, ya: 0 },
        { xa: 30, ya: 20 },
        { xa: 0, ya: 20 },
      ],
      close: true,
    })
    return shapeId
  }

  // Reference: plain extrusion
  const s0 = await makeProfile('Ref')
  const r0 = await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 40], curves: s0 })
  console.log('[05] reference result:', r0.result, 'maxLevel:', r0.maxLevel)

  // With translation only
  const s1 = await makeProfile('Translated')
  const r1 = await api.v1.solid.extrusion({
    id: eifId, direction: [0, 0, 40], curves: s1,
    translation: [60, 0, 0],
  })
  console.log('[05] translated result:', r1.result, 'maxLevel:', r1.maxLevel)

  // With rotation only (45° around Z)
  const s2 = await makeProfile('Rotated')
  const r2 = await api.v1.solid.extrusion({
    id: eifId, direction: [0, 0, 40], curves: s2,
    rotation: [0, 0, Math.PI / 4],
  })
  console.log('[05] rotated result:', r2.result, 'maxLevel:', r2.maxLevel)

  // With both rotation + translation (default rotateFirst=true)
  const s3 = await makeProfile('RotTrans')
  const r3 = await api.v1.solid.extrusion({
    id: eifId, direction: [0, 0, 40], curves: s3,
    rotation: [0, 0, Math.PI / 4],
    translation: [0, 80, 0],
  })
  console.log('[05] rot+trans (rotateFirst=true) result:', r3.result, 'maxLevel:', r3.maxLevel)

  // With rotateFirst=false
  const s4 = await makeProfile('RotTransFalse')
  const r4 = await api.v1.solid.extrusion({
    id: eifId, direction: [0, 0, 40], curves: s4,
    rotation: [0, 0, Math.PI / 4],
    translation: [0, 80, 0],
    rotateFirst: false,
  })
  console.log('[05] rot+trans (rotateFirst=false) result:', r4.result, 'maxLevel:', r4.maxLevel)

  filewrite({
    reference: { result: r0.result, maxLevel: r0.maxLevel },
    translated: { result: r1.result, maxLevel: r1.maxLevel },
    rotated: { result: r2.result, maxLevel: r2.maxLevel },
    rotTransTrue: { result: r3.result, maxLevel: r3.maxLevel },
    rotTransFalse: { result: r4.result, maxLevel: r4.maxLevel },
  }, 'transform-results')

  await snapshot('transforms')
  return { partId }
}
