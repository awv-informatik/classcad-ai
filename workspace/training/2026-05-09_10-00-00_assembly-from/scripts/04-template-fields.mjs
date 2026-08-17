// Test: explore what fields template entries need
// The error "Uninitialized member" suggests a required field is missing
export default async function (api, { snapshot, filewrite }) {
  console.log('[04] Exploring template field names...')

  // Create a part and save as OFB for use as data
  const partId = (await api.v1.part.create({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: partId, name: 'Box1', length: 40, width: 30, height: 20 })
  const saveRes = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result
  const ofbData = saveRes.content

  // Try variations of template entry structure
  const variants = [
    // Maybe it needs an 'id' or 'ident' field
    { label: 'with-id', tpl: { id: 'box1', name: 'BoxPart', data: ofbData, format: 'OFB', encoding: 'base64' } },
    { label: 'with-ident', tpl: { ident: 'box1', name: 'BoxPart', data: ofbData, format: 'OFB', encoding: 'base64' } },
    // Maybe it uses 'file' for local path
    { label: 'with-file', tpl: { name: 'BoxPart', file: '/tmp/nonexistent.ofb' } },
    // Maybe it uses 'url'
    { label: 'with-url', tpl: { name: 'BoxPart', url: 'file:///tmp/nonexistent.ofb' } },
    // Maybe it's 'content' not 'data'
    { label: 'with-content', tpl: { name: 'BoxPart', content: ofbData, format: 'OFB', encoding: 'base64' } },
    // Maybe 'product' or 'part'
    { label: 'with-product', tpl: { product: 'BoxPart', data: ofbData } },
    // Maybe it only needs file/url
    { label: 'file-only', tpl: { file: '/tmp/nonexistent.ofb' } },
  ]

  for (const v of variants) {
    await api.v1.common.clear({})
    const json = { templates: [v.tpl], instances: [], constraints: [] }
    const r = await api.v1.assembly.from({ data: JSON.stringify(json), format: 'JSON' })
    console.log(`[04] ${v.label}: result:`, r.result, 'maxLevel:', r.maxLevel)
    if (r.messages && r.messages.length > 0) {
      console.log(`[04]   msg:`, r.messages[0].message.substring(0, 100))
    }
    filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, v.label)
  }

  return {}
}
