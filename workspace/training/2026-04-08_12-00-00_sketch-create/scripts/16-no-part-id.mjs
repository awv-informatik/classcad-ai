// Test: sketch.create without a part ID (error case)
export default async function (api, { snapshot, filewrite }) {
  // Attempt to create sketch with no part
  const r1 = await api.v1.sketch.create({})
  console.log('[16] no id result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[16] no id messages:', JSON.stringify(r1.messages))

  // Attempt with invalid ID
  const r2 = await api.v1.sketch.create({ id: 99999 })
  console.log('[16] invalid id result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[16] invalid id messages:', JSON.stringify(r2.messages))

  filewrite({
    noId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    invalidId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'error-cases')

  return {}
}
