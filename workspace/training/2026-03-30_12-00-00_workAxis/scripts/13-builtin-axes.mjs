// Test: check if parts have built-in work axes (like they have Top/Front/Right planes)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Try common names for built-in axes
  const names = ['X', 'Y', 'Z', 'XAxis', 'YAxis', 'ZAxis', 'WorkAxis', 'Axis1', 'Axis2', 'Axis3']
  const results = {}
  for (const name of names) {
    const r = await api.v1.part.getWorkGeometry({ id: partId, name })
    results[name] = { result: r.result, maxLevel: r.maxLevel }
    if (r.result) {
      console.log('[13] found built-in axis:', name, '=', r.result)
    }
  }

  // Check structure for any work axis features
  const r = await api.v1.part.create({ name: 'Dummy' })  // just to get structure
  // Actually let's look at the initial part structure
  const structR = await api.v1.part.workAxis({ id: partId, name: 'probe' })
  filewrite(structR.structure, 'structure-with-axis')

  console.log('[13] results:', JSON.stringify(results))
  filewrite(results, 'builtin-search')

  return { partId }
}
