// Test passing a single geometry ID directly (no rigid set) as rigidSetId
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SingleGeomTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a circle
  const c = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 8 })).result
  console.log('[05] circle:', c)

  // Try passing circle ID directly as rigidSetId (docs say "rigidset or single object")
  const r = await api.v1.sketch.linearPattern({
    id: skId,
    rigidSetId: c,
    xCount: 3,
    xDistance: 25,
  })
  console.log('[05] maxLevel:', r.maxLevel)
  console.log('[05] result:', JSON.stringify(r.result))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'single-geom-full')

  if (r.maxLevel <= 31) {
    await snapshot('single-geom-pattern')
  }

  return { partId }
}
