export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const boxId = (await api.v1.part.box({ id: partId })).result

  const results = {}

  // Empty string
  const r1 = await api.v1.part.getFeature({ id: partId, name: '' })
  results['empty'] = { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }
  console.log('[16] empty string:', r1.result, 'maxLevel:', r1.maxLevel)

  // Whitespace
  const r2 = await api.v1.part.getFeature({ id: partId, name: '  ' })
  results['whitespace'] = { result: r2.result, maxLevel: r2.maxLevel }
  console.log('[16] whitespace:', r2.result, 'maxLevel:', r2.maxLevel)

  // Special characters
  const r3 = await api.v1.part.getFeature({ id: partId, name: 'Box/1' })
  results['slash'] = { result: r3.result, maxLevel: r3.maxLevel }
  console.log('[16] slash:', r3.result, 'maxLevel:', r3.maxLevel)

  // Missing name param
  try {
    const r4 = await api.v1.part.getFeature({ id: partId })
    results['noName'] = { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages }
    console.log('[16] no name:', r4.result, 'maxLevel:', r4.maxLevel)
  } catch (e) {
    results['noName'] = { error: e.message }
    console.log('[16] no name error:', e.message)
  }

  // Missing id param
  try {
    const r5 = await api.v1.part.getFeature({ name: 'Box' })
    results['noId'] = { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages }
    console.log('[16] no id:', r5.result, 'maxLevel:', r5.maxLevel)
  } catch (e) {
    results['noId'] = { error: e.message }
    console.log('[16] no id error:', e.message)
  }

  // Wrong id type (pass box ID instead of part ID)
  const r6 = await api.v1.part.getFeature({ id: boxId, name: 'Box' })
  results['wrongIdType'] = { result: r6.result, maxLevel: r6.maxLevel, messages: r6.messages }
  console.log('[16] wrong id type:', r6.result, 'maxLevel:', r6.maxLevel)

  // Invalid id (0)
  const r7 = await api.v1.part.getFeature({ id: 0, name: 'Box' })
  results['zeroId'] = { result: r7.result, maxLevel: r7.maxLevel, messages: r7.messages }
  console.log('[16] zero id:', r7.result, 'maxLevel:', r7.maxLevel)

  filewrite(results, 'edge-cases')
  return { partId }
}
