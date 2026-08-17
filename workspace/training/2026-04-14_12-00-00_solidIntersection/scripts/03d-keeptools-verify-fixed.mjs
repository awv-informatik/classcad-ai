// After keepTools intersection, verify tool is usable with correct translate params
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IntersectionKeepToolsFixed' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 80, height: 60
  })).result

  const box2 = (await api.v1.solid.box({
    id: eifId, length: 60, width: 40, height: 80,
    translation: [60, 30, -10]
  })).result

  console.log('[03d] box1:', box1, 'box2:', box2)

  const r = await api.v1.solid.intersection({ id: eifId, target: box1, tools: [box2], keepTools: true })
  console.log('[03d] intersection result:', r.result, 'maxLevel:', r.maxLevel)

  // Try translating the kept tool — correct param name is `target`
  console.log('[03d] attempting translate on kept tool (box2)...')
  const tr = await api.v1.solid.translation({ id: eifId, target: box2, vector: [0, 0, 100] })
  console.log('[03d] translate result:', tr.result, 'maxLevel:', tr.maxLevel)
  console.log('[03d] translate messages:', JSON.stringify(tr.messages))

  filewrite({ intersectionResult: r.result, translateResult: tr.result, translateMaxLevel: tr.maxLevel, translateMessages: tr.messages }, 'keeptools-verify-fixed')

  await snapshot('after-keeptools-translate')

  return { partId, result: r.result }
}
