// 11 — Create via part.sketch, retrieve via part.getSketch
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create via part.sketch
  const sk = await api.v1.part.sketch({ id: partId, name: 'MyProfile' })
  console.log('[11] created id:', sk.result)

  // Retrieve via part.getSketch
  const found = await api.v1.part.getSketch({ id: partId, name: 'MyProfile' })
  console.log('[11] getSketch result:', found.result, 'maxLevel:', found.maxLevel)
  console.log('[11] ids match?', sk.result === found.result)

  // Try non-existent name
  const notFound = await api.v1.part.getSketch({ id: partId, name: 'DoesNotExist' })
  console.log('[11] not found — result:', notFound.result, 'maxLevel:', notFound.maxLevel)
  console.log('[11] not found — msgs:', JSON.stringify(notFound.messages))

  filewrite({
    created: { result: sk.result, maxLevel: sk.maxLevel },
    found: { result: found.result, maxLevel: found.maxLevel },
    notFound: { result: notFound.result, maxLevel: notFound.maxLevel, messages: notFound.messages },
  }, 'getsketch-results')

  return { partId, createdId: sk.result, foundId: found.result, notFoundResult: notFound.result }
}
