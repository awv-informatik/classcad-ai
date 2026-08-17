// Test: check for built-in work coordinate systems
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const names = ['WorkCSys', 'CSys', 'Origin', 'World', 'Global', 'Default', 'CS1']
  const results = {}
  for (const name of names) {
    const r = await api.v1.part.getWorkGeometry({ id: partId, name })
    results[name] = { result: r.result, maxLevel: r.maxLevel }
    if (r.result) console.log('[08] found:', name, '=', r.result)
  }

  console.log('[08] results:', JSON.stringify(results))
  filewrite(results, 'builtin-search')

  return { partId }
}
