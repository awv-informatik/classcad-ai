// Test deflate-only save and load (no base64)
// The theory is that deflated binary corrupts in JSON transport
// But can the server load it back if we pass it straight through?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeflateOnly' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Save with deflate only
  const saved = await api.v1.common.save({ format: 'OFB', compression: 'deflate' })
  console.log('[06] deflate-only save: success=', saved.result.success)
  console.log('[06] content length:', saved.result.content?.length)
  console.log('[06] content type:', typeof saved.result.content)

  // Check if content has binary chars (non-printable ASCII)
  const content = saved.result.content || ''
  let nonPrintable = 0
  let total = content.length
  for (let i = 0; i < Math.min(total, 500); i++) {
    const code = content.charCodeAt(i)
    if (code < 32 && code !== 10 && code !== 13 && code !== 9) nonPrintable++
    if (code > 126) nonPrintable++
  }
  console.log('[06] non-printable chars in first 500:', nonPrintable, '/', Math.min(total, 500))

  // Try to load it back
  await api.v1.common.clear({})
  try {
    const loaded = await api.v1.common.load({ data: saved.result.content, format: 'OFB', compression: 'deflate' })
    console.log('[06] load: id=', loaded.result?.id, 'maxLevel=', loaded.maxLevel)
    console.log('[06] load messages:', JSON.stringify(loaded.messages?.map(m => m.message)))
    filewrite({
      saveLen: total,
      nonPrintableChars: nonPrintable,
      loadSuccess: !!loaded.result?.id,
      loadId: loaded.result?.id,
      loadMaxLevel: loaded.maxLevel,
    }, 'deflate-only')
  } catch (e) {
    console.log('[06] load ERROR:', e.message)
    filewrite({
      saveLen: total,
      nonPrintableChars: nonPrintable,
      loadError: e.message,
    }, 'deflate-only')
  }

  return { partId }
}
