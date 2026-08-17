// Test: create OFB file on disk, then reference it in JSON template
// Also try the `file` parameter of assembly.from directly (non-JSON path)
import { writeFileSync } from 'fs'

export default async function (api, { snapshot, filewrite }) {
  console.log('[06] Creating OFB file then referencing in JSON...')

  // Step 1: Create a part and save as OFB
  const partId = (await api.v1.part.create({ name: 'BoxPart' })).result
  await api.v1.part.box({ id: partId, name: 'B1', length: 40, width: 30, height: 20 })
  const saveRes = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result
  const ofbData = saveRes.content
  console.log('[06] Saved OFB, length:', ofbData.length)

  // Write OFB to disk (decode base64 first)
  const ofbBuf = Buffer.from(ofbData, 'base64')
  const ofbPath = '/tmp/cc-test-box.ofb'
  writeFileSync(ofbPath, ofbBuf)
  console.log('[06] Written OFB to:', ofbPath, 'size:', ofbBuf.length)

  // Clear and try assembly.from with file reference in template
  await api.v1.common.clear({})

  // Variant 1: template with 'file' field
  const json1 = {
    templates: [{ name: 'BoxPart', file: ofbPath }],
    instances: [],
    constraints: [],
  }
  const r1 = await api.v1.assembly.from({ data: JSON.stringify(json1), format: 'JSON' })
  console.log('[06] template file ref:', 'result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[06]   msg:', r1.messages[0].message.substring(0, 120))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'template-file-ref')

  // Variant 2: template with 'source' field
  await api.v1.common.clear({})
  const json2 = {
    templates: [{ name: 'BoxPart', source: ofbPath }],
    instances: [],
    constraints: [],
  }
  const r2 = await api.v1.assembly.from({ data: JSON.stringify(json2), format: 'JSON' })
  console.log('[06] template source ref:', 'result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[06]   msg:', r2.messages[0].message.substring(0, 120))

  // Variant 3: template with 'path' field
  await api.v1.common.clear({})
  const json3 = {
    templates: [{ name: 'BoxPart', path: ofbPath }],
    instances: [],
    constraints: [],
  }
  const r3 = await api.v1.assembly.from({ data: JSON.stringify(json3), format: 'JSON' })
  console.log('[06] template path ref:', 'result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[06]   msg:', r3.messages[0].message.substring(0, 120))

  // Test: assembly.from with file param directly (not JSON, actual ECXML file)
  // Save an ECXML file — but we can't export ECXML...
  // Let's try loading an OFB file directly via assembly.from (not loadProduct)
  await api.v1.common.clear({})
  const r4 = await api.v1.assembly.from({ file: ofbPath })
  console.log('[06] from file directly:', 'result:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages?.length) console.log('[06]   msg:', r4.messages[0].message.substring(0, 120))
  filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'from-file-direct')

  return {}
}
