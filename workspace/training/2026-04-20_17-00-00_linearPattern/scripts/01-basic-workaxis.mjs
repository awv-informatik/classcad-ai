export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinearPatternBasic' })).result

  // Create a small box offset from origin
  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'Box1',
    length: 20,
    width: 15,
    height: 25,
  })).result
  console.log('[01] boxId:', boxId)

  // Create a work axis along X for pattern direction
  const waId = (await api.v1.part.workAxis({
    id: partId,
    name: 'PatternAxis',
    origin: [0, 0, 0],
    direction: [1, 0, 0],
  })).result
  console.log('[01] workAxisId:', waId)

  await snapshot('before-pattern')

  // Linear pattern: 4 copies, 40mm apart along X axis
  const r = await api.v1.part.linearPattern({
    id: partId,
    name: 'LP1',
    targets: [boxId],
    dir1: {
      references: [waId],
      distance: 40,
      count: 4,
    },
  })

  console.log('[01] linearPattern result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'lp-response')

  await snapshot('after-pattern')

  return { partId, boxId, waId, lpId: r.result }
}
