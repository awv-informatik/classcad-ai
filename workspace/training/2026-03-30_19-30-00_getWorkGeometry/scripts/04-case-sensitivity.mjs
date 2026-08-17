// Test case sensitivity of getWorkGeometry
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GWGTest' })).result

  // Create with mixed-case name
  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'CamelCasePlane', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result

  // Try exact, lowercase, uppercase
  const names = ['CamelCasePlane', 'camelcaseplane', 'CAMELCASEPLANE', 'camelCasePlane']
  const results = {}
  for (const name of names) {
    const r = await api.v1.part.getWorkGeometry({ id: partId, name })
    results[name] = { result: r.result, maxLevel: r.maxLevel }
    console.log(`[04] name="${name}" → result:`, r.result, 'maxLevel:', r.maxLevel)
  }

  // Also test built-in case sensitivity
  for (const name of ['Top', 'top', 'TOP']) {
    const r = await api.v1.part.getWorkGeometry({ id: partId, name })
    results[name] = { result: r.result, maxLevel: r.maxLevel }
    console.log(`[04] builtin "${name}" → result:`, r.result, 'maxLevel:', r.maxLevel)
  }

  filewrite(results, 'case-sensitivity')
  return { partId }
}
