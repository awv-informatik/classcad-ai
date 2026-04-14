// Test that direction vector LENGTH determines extrusion distance
// Compare [0,0,40] vs [0,0,120] — should produce different height solids
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DirLenTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  async function makeProfile(name) {
    const shapeId = (await api.v1.curve.shape({ id: eifId, name })).result
    await api.v1.curve.advancedPolyline({
      id: shapeId,
      pld: [
        { xa: 0, ya: 0 },
        { xa: 20, ya: 0 },
        { xa: 20, ya: 20 },
        { xa: 0, ya: 20 },
      ],
      close: true,
    })
    return shapeId
  }

  // Short extrusion (40 units) — reference box for scale comparison
  const refBox = (await api.v1.solid.box({ id: eifId, length: 5, width: 5, height: 5, translation: [-15, 0, 0] })).result

  // Short extrusion
  const s1 = await makeProfile('Short')
  const r1 = await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 40], curves: s1 })
  console.log('[08] short (40) result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Long extrusion
  const s2 = await makeProfile('Long')
  const r2 = await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 120], curves: s2, translation: [40, 0, 0] })
  console.log('[08] long (120) result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Very short direction (unit vector)
  const s3 = await makeProfile('Unit')
  const r3 = await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, 1], curves: s3, translation: [80, 0, 0] })
  console.log('[08] unit (1) result:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    short: { result: r1.result, maxLevel: r1.maxLevel },
    long: { result: r2.result, maxLevel: r2.maxLevel },
    unit: { result: r3.result, maxLevel: r3.maxLevel },
  }, 'direction-length')

  await snapshot('direction-length')
  return { partId }
}
