// Test: EQUAL_RADIUS — does the smaller circle grow to match the fixed one?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'EqRadTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Fixed circle, radius 30
  const c1 = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30 })).result
  await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [c1] })

  // Smaller circle, radius 15
  const c2 = (await api.v1.sketch.circle({ id: skId, centerPos: [80, 0, 0], radius: 15 })).result

  // Get geometry data before
  const geo2Before = (await api.v1.sketch.getGeometry({ id: c2 })).result
  console.log('[08] c2 before:', JSON.stringify(geo2Before))

  await snapshot('before')

  const cr = await api.v1.sketch.constraint({ id: skId, type: 'EQUAL_RADIUS', geomIds: [c1, c2] })
  console.log('[08] constraint result:', cr.result, 'maxLevel:', cr.maxLevel)

  const geo2After = (await api.v1.sketch.getGeometry({ id: c2 })).result
  console.log('[08] c2 after:', JSON.stringify(geo2After))

  await snapshot('after')

  filewrite({ before: geo2Before, after: geo2After, constraintResult: cr.result, maxLevel: cr.maxLevel }, 'equal-radius-data')

  return { partId }
}
