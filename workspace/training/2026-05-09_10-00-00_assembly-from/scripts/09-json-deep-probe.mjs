// Test: deep probe of JSON format by trying nested structures
// The empty-arrays version worked. Now find what template entries need.
// Strategy: add more and more fields to template entries
export default async function (api, { snapshot, filewrite }) {
  console.log('[09] Deep probing JSON template structure...')

  // Prepare OFB data
  const partId = (await api.v1.part.create({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: partId, name: 'B1', length: 40, width: 30, height: 20 })
  const saveRes = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result
  const ofbData = saveRes.content

  // Also save as STP
  const stpRes = (await api.v1.common.save({ format: 'STP', encoding: 'base64' })).result
  const stpData = stpRes.content

  // The error comes from "jsonAsmBuilder.CreateTemplates"
  // Let me try a template object that has ALL loadProduct-style fields
  const attempts = [
    // Maybe template is exactly like loadProduct params
    { label: 'loadProduct-style', tpl: { data: ofbData, encoding: 'base64', format: 'OFB', name: 'Box' } },
    // Maybe it needs a 'type' or 'kind' field
    { label: 'with-type-part', tpl: { type: 'part', data: ofbData, encoding: 'base64', format: 'OFB', name: 'Box' } },
    { label: 'with-kind-part', tpl: { kind: 'part', data: ofbData, encoding: 'base64', format: 'OFB', name: 'Box' } },
    // STP instead of OFB
    { label: 'stp-data', tpl: { data: stpData, encoding: 'base64', format: 'STP', name: 'Box' } },
    // Maybe name isn't 'name' but something else
    { label: 'ident-field', tpl: { ident: 'Box', data: ofbData, encoding: 'base64', format: 'OFB' } },
    { label: 'label-field', tpl: { label: 'Box', data: ofbData, encoding: 'base64', format: 'OFB' } },
    // Maybe data should be raw (not base64)
    { label: 'raw-data', tpl: { data: 'raw-content', format: 'OFB', name: 'Box' } },
    // Maybe the field is 'content' not 'data'
    { label: 'content-field', tpl: { content: ofbData, encoding: 'base64', format: 'OFB', name: 'Box' } },
    // Maybe the template is just a string (file path)
    { label: 'string-template', tpl: '/tmp/cc-test-box.ofb' },
    // Maybe it needs 'compression'
    { label: 'with-compression', tpl: { data: ofbData, encoding: 'base64', compression: 'deflate', format: 'OFB', name: 'Box' } },
    // Maybe 'ofb' as direct field
    { label: 'ofb-field', tpl: { ofb: ofbData, name: 'Box' } },
    // Maybe it expects OFB base64 directly in data without encoding field
    { label: 'data-only', tpl: { data: ofbData, name: 'Box' } },
    // Completely minimal — just name + file as local path
    { label: 'name-file', tpl: { name: 'Box', file: '/tmp/cc-test-box.ofb', format: 'OFB' } },
  ]

  for (const { label, tpl } of attempts) {
    await api.v1.common.clear({})
    const json = { templates: [tpl], instances: [], constraints: [] }
    const r = await api.v1.assembly.from({ data: JSON.stringify(json), format: 'JSON' })
    const status = r.maxLevel <= 31 ? '✓' : r.maxLevel <= 41 ? '⚠' : '❌'
    console.log(`[09] ${status} ${label}: result:${r.result} maxLevel:${r.maxLevel}`)
    if (r.maxLevel <= 31) {
      filewrite({ label, result: r.result, messages: r.messages, maxLevel: r.maxLevel }, `success-${label}`)
    } else if (r.messages?.length && !r.messages[0].message.includes('Uninitialized member')) {
      // Different error = progress!
      console.log(`[09]   NEW ERROR: ${r.messages[0].message.substring(0, 120)}`)
      filewrite({ label, result: r.result, messages: r.messages, maxLevel: r.maxLevel }, `new-error-${label}`)
    }
  }

  return {}
}
