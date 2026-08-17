// Test error cases: no assembly, bad format, empty data, no params
export default async function (api, { filewrite }) {
  // Test 1: loadProduct WITHOUT an assembly (in a part context)
  const partId = (await api.v1.part.create({ name: 'StandalonePart' })).result
  const r1 = await api.v1.assembly.loadProduct({ data: 'test', format: 'OFB' })
  console.log('[06] Without assembly - maxLevel:', r1.maxLevel, 'result:', JSON.stringify(r1.result))
  if (r1.messages.length > 0) console.log('[06] messages:', r1.messages.map(m => m.message).join('; '))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'no-assembly')

  // Test 2: loadProduct with empty data
  await api.v1.common.clear({})
  const asmId = (await api.v1.assembly.create({ name: 'ErrAsm' })).result

  const r2 = await api.v1.assembly.loadProduct({ data: '', format: 'OFB' })
  console.log('[06] Empty data - maxLevel:', r2.maxLevel, 'result:', JSON.stringify(r2.result))
  if (r2.messages.length > 0) console.log('[06] messages:', r2.messages.map(m => m.message).join('; '))

  // Test 3: No source params (no data/file/url)
  const r3 = await api.v1.assembly.loadProduct({ format: 'OFB' })
  console.log('[06] No source - maxLevel:', r3.maxLevel, 'result:', JSON.stringify(r3.result))
  if (r3.messages.length > 0) console.log('[06] messages:', r3.messages.map(m => m.message).join('; '))

  // Test 4: Invalid format
  const r4 = await api.v1.assembly.loadProduct({ data: 'test', format: 'STL' })
  console.log('[06] STL format - maxLevel:', r4.maxLevel, 'result:', JSON.stringify(r4.result))
  if (r4.messages.length > 0) console.log('[06] messages:', r4.messages.map(m => m.message).join('; '))

  // Test 5: OFB data but STP format (mismatch)
  await api.v1.common.clear({})
  const p = (await api.v1.part.create({ name: 'MismatchTest' })).result
  await api.v1.part.box({ id: p, name: 'B', length: 30, width: 30, height: 30 })
  const saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  const ofbData = saved.result.content

  await api.v1.common.clear({})
  const asm2 = (await api.v1.assembly.create({ name: 'MismatchAsm' })).result
  const r5 = await api.v1.assembly.loadProduct({ data: ofbData, format: 'STP', encoding: 'base64', compression: 'deflate' })
  console.log('[06] OFB as STP - maxLevel:', r5.maxLevel, 'result:', JSON.stringify(r5.result))
  if (r5.messages.length > 0) console.log('[06] messages:', r5.messages.map(m => m.message).join('; '))

  filewrite({
    noAssembly: { maxLevel: r1.maxLevel, hasResult: !!r1.result },
    emptyData: { maxLevel: r2.maxLevel, hasResult: !!r2.result },
    noSource: { maxLevel: r3.maxLevel, hasResult: !!r3.result },
    stlFormat: { maxLevel: r4.maxLevel, hasResult: !!r4.result },
    mismatch: { maxLevel: r5.maxLevel, hasResult: !!r5.result },
  }, 'error-summary')

  return {}
}
