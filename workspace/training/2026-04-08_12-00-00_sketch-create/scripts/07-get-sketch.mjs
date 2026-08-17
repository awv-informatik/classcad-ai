// Test: part.getSketch — retrieve sketch by name
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result

  const sk = await api.v1.sketch.create({ id: partId, name: 'FindMe' })
  console.log('[07] created sketch:', sk.result)

  // Retrieve by name
  const r = await api.v1.part.getSketch({ id: partId, name: 'FindMe' })
  console.log('[07] getSketch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[07] matches creation ID:', r.result === sk.result)

  // Try non-existent name
  const r2 = await api.v1.part.getSketch({ id: partId, name: 'DoesNotExist' })
  console.log('[07] getSketch non-existent result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[07] non-existent messages:', JSON.stringify(r2.messages))

  filewrite({
    created: sk.result,
    found: r.result,
    matches: r.result === sk.result,
    notFound: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'get-sketch')

  return { partId }
}
