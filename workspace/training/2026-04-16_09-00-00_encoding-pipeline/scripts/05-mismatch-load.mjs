// Test mismatched encoding params on load
// Save with deflate+base64, try loading with wrong params
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MismatchTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Save with deflate+base64
  const saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  console.log('[05] saved len:', saved.result.content?.length)

  const results = {}

  // 1. Load with no params (should fail — data is encoded)
  await api.v1.common.clear({})
  try {
    const r1 = await api.v1.common.load({ data: saved.result.content, format: 'OFB' })
    console.log('[05] no-params: id=', r1.result?.id, 'maxLevel=', r1.maxLevel)
    results.noParams = { success: !!r1.result?.id, maxLevel: r1.maxLevel, msgs: r1.messages?.map(m => m.message) }
  } catch (e) {
    console.log('[05] no-params: ERROR:', e.message)
    results.noParams = { error: e.message }
  }

  // 2. Load with base64 only (missing compression — should fail or partial)
  await api.v1.common.clear({})
  try {
    const r2 = await api.v1.common.load({ data: saved.result.content, format: 'OFB', encoding: 'base64' })
    console.log('[05] b64-only: id=', r2.result?.id, 'maxLevel=', r2.maxLevel)
    results.b64Only = { success: !!r2.result?.id, maxLevel: r2.maxLevel, msgs: r2.messages?.map(m => m.message) }
  } catch (e) {
    console.log('[05] b64-only: ERROR:', e.message)
    results.b64Only = { error: e.message }
  }

  // 3. Load with compression only (missing base64 — should fail)
  await api.v1.common.clear({})
  try {
    const r3 = await api.v1.common.load({ data: saved.result.content, format: 'OFB', compression: 'deflate' })
    console.log('[05] deflate-only: id=', r3.result?.id, 'maxLevel=', r3.maxLevel)
    results.deflateOnly = { success: !!r3.result?.id, maxLevel: r3.maxLevel, msgs: r3.messages?.map(m => m.message) }
  } catch (e) {
    console.log('[05] deflate-only: ERROR:', e.message)
    results.deflateOnly = { error: e.message }
  }

  // 4. Load with correct params (control)
  await api.v1.common.clear({})
  try {
    const r4 = await api.v1.common.load({ data: saved.result.content, format: 'OFB', encoding: 'base64', compression: 'deflate' })
    console.log('[05] correct: id=', r4.result?.id, 'maxLevel=', r4.maxLevel)
    results.correct = { success: !!r4.result?.id, maxLevel: r4.maxLevel }
  } catch (e) {
    console.log('[05] correct: ERROR:', e.message)
    results.correct = { error: e.message }
  }

  filewrite(results, 'mismatch-results')
  return { partId }
}
