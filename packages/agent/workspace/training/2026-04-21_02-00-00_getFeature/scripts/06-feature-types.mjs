export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result

  // Create various feature types and look them up
  const boxId = (await api.v1.part.box({ id: partId })).result
  const cylId = (await api.v1.part.cylinder({ id: partId })).result
  const coneId = (await api.v1.part.cone({ id: partId })).result
  const sphereId = (await api.v1.part.sphere({ id: partId })).result

  console.log('[06] boxId:', boxId, 'cylId:', cylId, 'coneId:', coneId, 'sphereId:', sphereId)

  // Look up each by default name
  const results = {}
  for (const [name, expectedId] of [['Box', boxId], ['Cylinder', cylId], ['Cone', coneId], ['Sphere', sphereId]]) {
    const r = await api.v1.part.getFeature({ id: partId, name })
    results[name] = { result: r.result, maxLevel: r.maxLevel, match: r.result === expectedId }
    console.log('[06] "' + name + '":', r.result, 'match:', r.result === expectedId)
  }

  filewrite(results, 'feature-types')
  return { partId }
}
