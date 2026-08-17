// Test: try ECXML format + brute-force more template field names
import { writeFileSync } from 'fs'

export default async function (api, { snapshot, filewrite }) {
  console.log('[07] Testing ECXML format and more field names...')

  // Create OFB file for reference
  const partId = (await api.v1.part.create({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: partId, name: 'B1', length: 40, width: 30, height: 20 })
  const saveRes = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result
  const ofbData = saveRes.content
  const ofbBuf = Buffer.from(ofbData, 'base64')
  const ofbPath = '/tmp/cc-test-box.ofb'
  writeFileSync(ofbPath, ofbBuf)

  // TEST 1: Try minimal ECXML via data parameter
  await api.v1.common.clear({})
  const ecxml1 = `<?xml version="1.0" encoding="UTF-8"?>
<ecxml>
  <assembly name="TestAsm">
    <part name="Box" file="${ofbPath}"/>
  </assembly>
</ecxml>`
  const r1 = await api.v1.assembly.from({ data: ecxml1, format: 'ECXML' })
  console.log('[07] ECXML v1:', 'result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[07]   msg:', r1.messages[0].message.substring(0, 150))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'ecxml-v1')

  // TEST 2: Try XML format
  await api.v1.common.clear({})
  const r2 = await api.v1.assembly.from({ data: ecxml1, format: 'XML' })
  console.log('[07] XML v1:', 'result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[07]   msg:', r2.messages[0].message.substring(0, 150))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'xml-v1')

  // TEST 3: Write ECXML to file and use file param
  const ecxmlPath = '/tmp/cc-test.ecxml'
  writeFileSync(ecxmlPath, ecxml1)
  await api.v1.common.clear({})
  const r3 = await api.v1.assembly.from({ file: ecxmlPath })
  console.log('[07] ECXML file:', 'result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[07]   msg:', r3.messages[0].message.substring(0, 150))
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'ecxml-file')

  // TEST 4: More JSON field names
  const extraFields = [
    'geometry', 'model', 'shape', 'body', 'ofb', 'stp', 'component',
    'definition', 'resource', 'location', 'ref', 'reference', 'load',
    'importFrom', 'import', 'part', 'assembly', 'product', 'template',
  ]

  for (const field of extraFields) {
    await api.v1.common.clear({})
    const tpl = { name: 'BoxPart' }
    tpl[field] = ofbPath
    const json = { templates: [tpl], instances: [], constraints: [] }
    const r = await api.v1.assembly.from({ data: JSON.stringify(json), format: 'JSON' })
    if (r.maxLevel <= 31) {
      console.log(`[07] ★ FOUND field '${field}': result:`, r.result, 'maxLevel:', r.maxLevel)
      filewrite({ field, result: r.result, messages: r.messages, maxLevel: r.maxLevel }, `found-${field}`)
    }
  }
  console.log('[07] Field scan done')

  return {}
}
