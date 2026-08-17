// Test direction vector variants — different axes, angled, negative
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DirTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Helper: create a closed rect profile
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

  // Extrude along X
  const s1 = await makeProfile('AlongX')
  const r1 = await api.v1.solid.extrusion({ id: eifId, direction: [60, 0, 0], curves: s1 })
  console.log('[02] along X result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Extrude along Y
  const s2 = await makeProfile('AlongY')
  const r2 = await api.v1.solid.extrusion({ id: eifId, direction: [0, 60, 0], curves: s2, translation: [0, 0, 50] })
  console.log('[02] along Y result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Extrude along angled direction [1,1,1]
  const s3 = await makeProfile('Angled')
  const r3 = await api.v1.solid.extrusion({ id: eifId, direction: [30, 30, 30], curves: s3, translation: [50, 0, 0] })
  console.log('[02] angled [30,30,30] result:', r3.result, 'maxLevel:', r3.maxLevel)

  // Extrude along negative Z
  const s4 = await makeProfile('NegZ')
  const r4 = await api.v1.solid.extrusion({ id: eifId, direction: [0, 0, -40], curves: s4, translation: [0, 50, 0] })
  console.log('[02] negative Z result:', r4.result, 'maxLevel:', r4.maxLevel)

  filewrite({
    alongX: { result: r1.result, maxLevel: r1.maxLevel },
    alongY: { result: r2.result, maxLevel: r2.maxLevel },
    angled: { result: r3.result, maxLevel: r3.maxLevel },
    negZ: { result: r4.result, maxLevel: r4.maxLevel },
  }, 'direction-results')

  await snapshot('direction-variants')
  return { partId }
}
