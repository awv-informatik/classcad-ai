// Test: create a part, export as OFB, then use it as template data in assembly.from
export default async function (api, { snapshot, filewrite }) {
  console.log('[03] Building a part, exporting OFB, then using in assembly.from...')

  // Step 1: Create a simple part with a box
  const partId = (await api.v1.part.create({ name: 'BoxPart' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 40, width: 30, height: 20 })).result
  console.log('[03] Part created:', partId, 'box:', boxId)

  // Step 2: Save as OFB (base64)
  const saveRes = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result
  const ofbData = saveRes.content
  console.log('[03] OFB data length:', ofbData.length)

  // Step 3: Clear and try assembly.from with the OFB data as template
  await api.v1.common.clear({})

  // Test: template with data field containing OFB
  const json1 = {
    templates: [{ name: 'BoxPart', data: ofbData }],
    instances: [],
    constraints: [],
  }
  const r1 = await api.v1.assembly.from({ data: JSON.stringify(json1), format: 'JSON' })
  console.log('[03] template with ofb data:', 'result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'template-ofb')

  // Test: template with data + format
  await api.v1.common.clear({})
  const json2 = {
    templates: [{ name: 'BoxPart', data: ofbData, format: 'OFB' }],
    instances: [],
    constraints: [],
  }
  const r2 = await api.v1.assembly.from({ data: JSON.stringify(json2), format: 'JSON' })
  console.log('[03] template with ofb+format:', 'result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'template-ofb-format')

  // Test: template with data + format + encoding
  await api.v1.common.clear({})
  const json3 = {
    templates: [{ name: 'BoxPart', data: ofbData, format: 'OFB', encoding: 'base64' }],
    instances: [],
    constraints: [],
  }
  const r3 = await api.v1.assembly.from({ data: JSON.stringify(json3), format: 'JSON' })
  console.log('[03] template with ofb+format+encoding:', 'result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'template-ofb-format-encoding')

  if (r3.maxLevel <= 31) {
    await snapshot('assembly-from-json')
  }

  return { r1: r1.result, r2: r2.result, r3: r3.result }
}
