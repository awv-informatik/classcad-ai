// Test getWorkGeometry on built-in work axes and coordinate system
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GWGTest' })).result

  const names = ['XAxis', 'YAxis', 'ZAxis', 'X', 'Y', 'Z', 'Origin', 'WorkCSys', 'WorkAxis_X', 'WorkAxis_Y', 'WorkAxis_Z']
  const results = {}
  for (const name of names) {
    const r = await api.v1.part.getWorkGeometry({ id: partId, name })
    results[name] = { result: r.result, maxLevel: r.maxLevel }
    console.log(`[02] name="${name}" → result:`, r.result, 'maxLevel:', r.maxLevel)
  }

  filewrite(results, 'builtin-axes-csys')
  return { partId }
}
