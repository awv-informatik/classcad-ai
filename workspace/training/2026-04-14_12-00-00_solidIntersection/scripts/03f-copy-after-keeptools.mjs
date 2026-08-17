// Investigate: does solid.copy hang after keepTools intersection?
// The original 03 script hung when calling solid.copy on the kept tool.
// Test: intersection with keepTools, then copy the RESULT (not the tool)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyAfterKeepTools' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 80, height: 60
  })).result

  const box2 = (await api.v1.solid.box({
    id: eifId, length: 60, width: 40, height: 80,
    translation: [60, 30, -10]
  })).result

  console.log('[03f] box1:', box1, 'box2:', box2)

  const r = await api.v1.solid.intersection({ id: eifId, target: box1, tools: [box2], keepTools: true })
  console.log('[03f] intersection result:', r.result, 'maxLevel:', r.maxLevel)

  // Copy the RESULT (target), not the tool — this should be safe
  console.log('[03f] copying intersection result (box1)...')
  const copyResult = await api.v1.solid.copy({ id: eifId, solid: box1 })
  console.log('[03f] copy result solid:', copyResult.result, 'maxLevel:', copyResult.maxLevel)

  filewrite({ copyResult: copyResult.result, copyMaxLevel: copyResult.maxLevel }, 'copy-result-after-keeptools')

  await snapshot('after-copy-result')

  return { partId }
}
