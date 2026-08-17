// After keepTools intersection, verify tool is still usable by creating another box and unioning it
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IntersectionKeepToolsUnion' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 80, height: 60
  })).result

  const box2 = (await api.v1.solid.box({
    id: eifId, length: 60, width: 40, height: 80,
    translation: [60, 30, -10]
  })).result

  console.log('[03e] box1:', box1, 'box2:', box2)

  const r = await api.v1.solid.intersection({ id: eifId, target: box1, tools: [box2], keepTools: true })
  console.log('[03e] intersection result:', r.result, 'maxLevel:', r.maxLevel)

  // Verify tool (box2) is still valid by translating it (correct param name)
  console.log('[03e] translating kept tool (box2)...')
  const tr = await api.v1.solid.translation({ id: eifId, target: box2, translation: [0, 0, 100] })
  console.log('[03e] translate result:', tr.result, 'maxLevel:', tr.maxLevel)
  console.log('[03e] translate messages:', JSON.stringify(tr.messages))

  filewrite({ intersectionResult: r.result, translateResult: tr.result, translateMaxLevel: tr.maxLevel }, 'keeptools-union-verify')

  await snapshot('after-keeptools-with-translate')

  return { partId, result: r.result }
}
