// Test: workAxis as direction reference for linearPattern
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a box
  const boxR = await api.v1.part.box({ id: partId, length: 30, width: 30, height: 30 })
  const boxId = boxR.result
  console.log('[16] box:', boxId)

  // Create work axis for pattern direction
  const waId = (await api.v1.part.workAxis({
    id: partId,
    name: 'PatternDir',
    position: [0, 0, 0],
    direction: [1, 0, 0]
  })).result
  console.log('[16] workAxis:', waId)

  await snapshot('before-pattern')

  // Use workAxis as linear pattern direction
  if (boxId && waId) {
    const patR = await api.v1.part.linearPattern({
      id: partId,
      targets: [boxId],
      dir1: {
        references: [waId],
        distance: 50,
        count: 3
      }
    })
    console.log('[16] linearPattern result:', patR.result, 'maxLevel:', patR.maxLevel)
    if (patR.messages?.length) console.log('[16] msgs:', JSON.stringify(patR.messages))
    filewrite({ result: patR.result, messages: patR.messages, maxLevel: patR.maxLevel }, 'pattern-response')

    await snapshot('after-pattern')
  }

  return { partId }
}
