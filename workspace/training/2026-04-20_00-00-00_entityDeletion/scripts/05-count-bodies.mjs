export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CountBodies' })).result

  const box = (await api.v1.part.box({ id: partId, name: 'Box1', length: 20, width: 20, height: 20 })).result
  const wa = (await api.v1.part.workAxis({ id: partId, name: 'WA1', origin: [0, 0, 0], direction: [1, 0, 0] })).result

  const pattern = (await api.v1.part.linearPattern({
    id: partId, name: 'LP1',
    targets: [box],
    dir1: { references: [wa], distance: 40, count: 4 }
  })).result
  console.log('[05] box:', box, 'pattern:', pattern)

  // Count bodies before deletion
  const gBefore = await api.v1.common.requestVisualisation({ id: partId })
  const bodiesBefore = gBefore.graphic ? gBefore.graphic.length : 'no graphic'
  console.log('[05] bodies before:', bodiesBefore)

  // Test 1: target pattern as plain ID (not object)
  const r1 = await api.v1.part.entityDeletion({ id: partId, name: 'Del1', targets: [pattern] })
  console.log('[05] del plain ID result:', r1.result, 'maxLevel:', r1.maxLevel)

  const g1 = await api.v1.common.requestVisualisation({ id: partId })
  const bodiesAfter1 = g1.graphic ? g1.graphic.length : 'no graphic'
  console.log('[05] bodies after plain ID deletion:', bodiesAfter1)

  await snapshot('after-plain-id')
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel, bodiesBefore, bodiesAfterPlainId: bodiesAfter1 }, 'plain-id-result')

  return { partId }
}
