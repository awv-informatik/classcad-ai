// Test encoding/compression combinations on load
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EncodingTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Save with different encoding combos
  const saveRaw = await api.v1.common.save({ format: 'OFB' })
  const saveB64 = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  const saveDeflateB64 = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })

  console.log('[08] Raw OFB length:', saveRaw.result.content?.length)
  console.log('[08] B64 OFB length:', saveB64.result.content?.length)
  console.log('[08] Deflate+B64 OFB length:', saveDeflateB64.result.content?.length)

  // Load raw OFB (no encoding/compression)
  await api.v1.common.clear({})
  const loadRaw = await api.v1.common.load({
    data: saveRaw.result.content,
    format: 'OFB',
  })
  console.log('[08] Load raw result:', JSON.stringify(loadRaw.result), 'maxLevel:', loadRaw.maxLevel)

  // Load base64-only OFB
  await api.v1.common.clear({})
  const loadB64 = await api.v1.common.load({
    data: saveB64.result.content,
    format: 'OFB',
    encoding: 'base64',
  })
  console.log('[08] Load b64 result:', JSON.stringify(loadB64.result), 'maxLevel:', loadB64.maxLevel)

  // Load deflate+base64 OFB
  await api.v1.common.clear({})
  const loadDeflateB64 = await api.v1.common.load({
    data: saveDeflateB64.result.content,
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })
  console.log('[08] Load deflate+b64 result:', JSON.stringify(loadDeflateB64.result), 'maxLevel:', loadDeflateB64.maxLevel)

  filewrite({
    raw: { result: loadRaw.result, maxLevel: loadRaw.maxLevel },
    b64: { result: loadB64.result, maxLevel: loadB64.maxLevel },
    deflateB64: { result: loadDeflateB64.result, maxLevel: loadDeflateB64.maxLevel },
  }, 'encoding-combos')

  await snapshot('after-encoding-test')

  return { raw: loadRaw.result, b64: loadB64.result, deflateB64: loadDeflateB64.result }
}
