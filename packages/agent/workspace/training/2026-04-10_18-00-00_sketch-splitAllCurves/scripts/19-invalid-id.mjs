// 19 — Error case: pass invalid ID (part ID instead of sketch ID)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitInvalid' })).result

  // Pass part ID instead of sketch ID
  const r = await api.v1.sketch.splitAllCurves({ id: partId })
  console.log('[19] with partId - result:', JSON.stringify(r.result))
  console.log('[19] with partId - maxLevel:', r.maxLevel)
  console.log('[19] with partId - messages:', JSON.stringify(r.messages))

  // Pass nonsense ID
  const r2 = await api.v1.sketch.splitAllCurves({ id: 99999 })
  console.log('[19] with 99999 - result:', JSON.stringify(r2.result))
  console.log('[19] with 99999 - maxLevel:', r2.maxLevel)
  console.log('[19] with 99999 - messages:', JSON.stringify(r2.messages))

  filewrite({
    partIdResult: { result: r.result, maxLevel: r.maxLevel, messages: r.messages },
    badIdResult: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }
  }, 'invalid-ids')
  return { partId }
}
