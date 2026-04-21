export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result

  // Create a box with default name
  const boxId = (await api.v1.part.box({ id: partId })).result
  console.log('[01] boxId:', boxId)

  // Look up the box by its default name "Box"
  const r1 = await api.v1.part.getFeature({ id: partId, name: 'Box' })
  console.log('[01] getFeature("Box") result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[01] match boxId?', r1.result === boxId)

  // Look up a name that doesn't exist
  const r2 = await api.v1.part.getFeature({ id: partId, name: 'NonExistent' })
  console.log('[01] getFeature("NonExistent") result:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    boxId,
    found: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    notFound: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
  }, 'basic-lookup')

  await snapshot('basic')
  return { partId }
}
