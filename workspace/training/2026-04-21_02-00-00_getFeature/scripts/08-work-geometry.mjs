export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result

  // Create work geometry features and look them up
  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'MyPlane' })).result
  const waId = (await api.v1.part.workAxis({ id: partId, name: 'MyAxis' })).result
  const wptId = (await api.v1.part.workPoint({ id: partId, name: 'MyPoint' })).result

  console.log('[08] wpId:', wpId, 'waId:', waId, 'wptId:', wptId)

  // Look them up
  const results = {}
  for (const [name, expectedId] of [['MyPlane', wpId], ['MyAxis', waId], ['MyPoint', wptId]]) {
    const r = await api.v1.part.getFeature({ id: partId, name })
    results[name] = { result: r.result, match: r.result === expectedId, maxLevel: r.maxLevel }
    console.log('[08] "' + name + '":', r.result, 'match:', r.result === expectedId)
  }

  // Also try default work geometry names (the built-in ones)
  for (const name of ['Origin', 'Top', 'Front', 'Right', 'XAxis', 'YAxis', 'ZAxis']) {
    const r = await api.v1.part.getFeature({ id: partId, name })
    results['default_' + name] = { result: r.result, maxLevel: r.maxLevel }
    console.log('[08] default "' + name + '":', r.result, 'maxLevel:', r.maxLevel)
  }

  filewrite(results, 'work-geometry')
  return { partId }
}
