// Test: ClassCAD-specific field names and capitalization variants
export default async function (api, { snapshot, filewrite }) {
  console.log('[11] Testing ClassCAD-specific field names...')

  // Prepare OFB
  const partId = (await api.v1.part.create({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: partId, name: 'B1', length: 40, width: 30, height: 20 })
  const saveRes = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result
  const ofbData = saveRes.content

  const attempts = [
    // ClassCAD class-based
    { label: 'class-CC_Part', tpl: { class: 'CC_Part', name: 'Box' } },
    { label: 'class-Part', tpl: { class: 'Part', name: 'Box' } },
    // With data + class
    { label: 'class+data', tpl: { class: 'CC_Part', name: 'Box', data: ofbData, encoding: 'base64', format: 'OFB' } },
    // Internal member names
    { label: 'localPath', tpl: { name: 'Box', localPath: '/tmp/cc-test-box.ofb' } },
    { label: 'rootPath', tpl: { name: 'Box', rootPath: '/tmp/' } },
    { label: 'partName', tpl: { partName: 'Box' } },
    // Capitalized versions
    { label: 'Name', tpl: { Name: 'Box' } },
    { label: 'Data', tpl: { Name: 'Box', Data: ofbData } },
    { label: 'File', tpl: { Name: 'Box', File: '/tmp/cc-test-box.ofb' } },
    { label: 'Type', tpl: { Name: 'Box', Type: 'part' } },
    // Maybe the template is a full product definition
    { label: 'productId', tpl: { productId: 'Box', name: 'Box' } },
    // Maybe it's an OFB reference
    { label: 'ofbData', tpl: { name: 'Box', ofbData: ofbData } },
    // Maybe 'src'
    { label: 'src', tpl: { name: 'Box', src: '/tmp/cc-test-box.ofb' } },
    // Maybe it needs a 'geometry' or 'solid' sub-object
    { label: 'solid', tpl: { name: 'Box', solid: { type: 'box', length: 40, width: 30, height: 20 } } },
    // Maybe 'value' or 'values'
    { label: 'value', tpl: { name: 'Box', value: ofbData } },
    // Maybe the whole template structure is different
    // What if template is { "Box": { data, format, encoding } }
    { label: 'name-as-key', tpl: { Box: { data: ofbData, format: 'OFB', encoding: 'base64' } } },
  ]

  for (const { label, tpl } of attempts) {
    await api.v1.common.clear({})
    const json = { templates: [tpl], instances: [], constraints: [] }
    const r = await api.v1.assembly.from({ data: JSON.stringify(json), format: 'JSON' })
    const status = r.maxLevel <= 31 ? '✓' : '❌'
    console.log(`[11] ${status} ${label}: result:${r.result} maxLevel:${r.maxLevel}`)
    if (r.maxLevel <= 31) {
      console.log(`[11] ★ FOUND!`)
      filewrite({ label, result: r.result, messages: r.messages, maxLevel: r.maxLevel }, `success-${label}`)
    } else if (r.messages?.length && !r.messages[0].message.includes('Uninitialized member')) {
      console.log(`[11]   DIFFERENT ERROR: ${r.messages[0].message.substring(0, 120)}`)
      filewrite({ label, result: r.result, messages: r.messages, maxLevel: r.maxLevel }, `diff-error-${label}`)
    }
  }

  return {}
}
