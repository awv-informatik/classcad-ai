// Test getWorkGeometry on built-in work planes
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GWGTest' })).result
  console.log('[01] partId:', partId)

  // Try various names for built-in work planes
  const names = ['Top', 'Front', 'Right', 'WorkPlane_Top', 'WorkPlane_Front', 'WorkPlane_Right', 'XY', 'XZ', 'YZ']
  const results = {}
  for (const name of names) {
    const r = await api.v1.part.getWorkGeometry({ id: partId, name })
    results[name] = { result: r.result, maxLevel: r.maxLevel }
    console.log(`[01] name="${name}" → result:`, r.result, 'maxLevel:', r.maxLevel)
  }

  filewrite(results, 'builtin-planes')
  return { partId }
}
