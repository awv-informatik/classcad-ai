// Test: alternative top-level JSON keys and structures
// Maybe the JSON format is completely different from templates/instances/constraints
export default async function (api, { snapshot, filewrite }) {
  console.log('[13] Testing alternative top-level JSON structures...')

  // Prepare OFB file
  const partId = (await api.v1.part.create({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: partId, name: 'B1', length: 40, width: 30, height: 20 })
  const saveRes = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result
  const ofbData = saveRes.content

  // Try with 'products' instead of 'templates'
  const structures = [
    { label: 'products', json: { products: [{ name: 'Box', data: ofbData, format: 'OFB', encoding: 'base64' }], instances: [], constraints: [] } },
    { label: 'parts', json: { parts: [{ name: 'Box', data: ofbData, format: 'OFB', encoding: 'base64' }], instances: [], constraints: [] } },
    { label: 'components', json: { components: [{ name: 'Box', file: '/tmp/cc-test-box.ofb' }], instances: [], constraints: [] } },
    // What if templates need a 'loadFrom' nested structure?
    { label: 'loadFrom', json: { templates: [{ name: 'Box', loadFrom: { data: ofbData, format: 'OFB', encoding: 'base64' } }], instances: [], constraints: [] } },
    // What if template entries are { name: ..., product: { ...loadProduct params } }
    { label: 'product-nested', json: { templates: [{ name: 'Box', product: { data: ofbData, format: 'OFB', encoding: 'base64' } }], instances: [], constraints: [] } },
    // What if template entries need 'features' array like part.* API calls?
    { label: 'features', json: { templates: [{ name: 'Box', features: [{ api: 'part.box', params: { length: 40, width: 30, height: 20 } }] }], instances: [], constraints: [] } },
    // What if it needs 'operations'?
    { label: 'operations', json: { templates: [{ name: 'Box', operations: [{ type: 'box', length: 40, width: 30, height: 20 }] }], instances: [], constraints: [] } },
    // What if each template has an 'import' key?
    { label: 'import', json: { templates: [{ name: 'Box', import: { file: '/tmp/cc-test-box.ofb', format: 'OFB' } }], instances: [], constraints: [] } },
  ]

  for (const { label, json } of structures) {
    await api.v1.common.clear({})
    const r = await api.v1.assembly.from({ data: JSON.stringify(json), format: 'JSON' })
    const status = r.maxLevel <= 31 ? '✓' : '❌'
    console.log(`[13] ${status} ${label}: result:${r.result} maxLevel:${r.maxLevel}`)
    if (r.maxLevel <= 31) {
      console.log('[13] ★ SUCCESS!')
      filewrite({ label, result: r.result, messages: r.messages }, `success-${label}`)
    } else if (r.messages?.length) {
      const msg = r.messages[0].message
      if (!msg.includes('Uninitialized member')) {
        console.log(`[13]   DIFF: ${msg.substring(0, 120)}`)
      }
    }
  }

  // Also try: what if the JSON defines an ECXML-like structure as JSON?
  await api.v1.common.clear({})
  const ecxmlJson = {
    assembly: {
      name: 'TestAsm',
      parts: [{ name: 'Box', file: '/tmp/cc-test-box.ofb' }],
      instances: [{ product: 'Box', transformation: [[0,0,0],[1,0,0],[0,1,0]] }],
    },
  }
  const r9 = await api.v1.assembly.from({ data: JSON.stringify(ecxmlJson), format: 'JSON' })
  console.log('[13] ecxml-as-json:', r9.result, r9.maxLevel)
  if (r9.messages?.length) console.log('[13]  ', r9.messages[0].message.substring(0, 120))

  return {}
}
