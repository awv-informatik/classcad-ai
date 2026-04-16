// Test reverse mismatches: save with one encoding, load with another
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RevMismatch' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  const results = {}

  // A: Save raw, load with base64 params
  const rawSaved = await api.v1.common.save({ format: 'OFB' })
  await api.v1.common.clear({})
  const rA = await api.v1.common.load({ data: rawSaved.result.content, format: 'OFB', encoding: 'base64' })
  console.log('[07] raw→b64: id=', rA.result?.id, 'maxLevel=', rA.maxLevel)
  results.rawToB64 = { success: !!rA.result?.id, maxLevel: rA.maxLevel, msgs: rA.messages?.map(m => m.message) }

  // B: Save base64, load raw (no encoding params)
  await api.v1.common.clear({})
  await api.v1.part.create({ name: 'Test2' })
  const eifId2 = (await api.v1.part.entityInjection({ id: (await api.v1.common.save({ format: 'OFB' })).result, name: 'E2' })).result
  // Actually, let's do this cleanly
  const partId2 = (await api.v1.part.create({ name: 'Test2' })).result
  const eifId3 = (await api.v1.part.entityInjection({ id: partId2 })).result
  await api.v1.solid.box({ id: eifId3, length: 80, width: 60, height: 40 })
  const b64Saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  await api.v1.common.clear({})
  const rB = await api.v1.common.load({ data: b64Saved.result.content, format: 'OFB' })
  console.log('[07] b64→raw: id=', rB.result?.id, 'maxLevel=', rB.maxLevel)
  results.b64ToRaw = { success: !!rB.result?.id, maxLevel: rB.maxLevel, msgs: rB.messages?.map(m => m.message) }

  // C: Save raw, load with deflate+base64 params
  const partId3 = (await api.v1.part.create({ name: 'Test3' })).result
  const eifId4 = (await api.v1.part.entityInjection({ id: partId3 })).result
  await api.v1.solid.box({ id: eifId4, length: 80, width: 60, height: 40 })
  const rawSaved2 = await api.v1.common.save({ format: 'OFB' })
  await api.v1.common.clear({})
  const rC = await api.v1.common.load({
    data: rawSaved2.result.content,
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })
  console.log('[07] raw→both: id=', rC.result?.id, 'maxLevel=', rC.maxLevel)
  results.rawToBoth = { success: !!rC.result?.id, maxLevel: rC.maxLevel, msgs: rC.messages?.map(m => m.message) }

  // D: Save base64, load with deflate+base64
  const partId4 = (await api.v1.part.create({ name: 'Test4' })).result
  const eifId5 = (await api.v1.part.entityInjection({ id: partId4 })).result
  await api.v1.solid.box({ id: eifId5, length: 80, width: 60, height: 40 })
  const b64Saved2 = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  await api.v1.common.clear({})
  const rD = await api.v1.common.load({
    data: b64Saved2.result.content,
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })
  console.log('[07] b64→both: id=', rD.result?.id, 'maxLevel=', rD.maxLevel)
  results.b64ToBoth = { success: !!rD.result?.id, maxLevel: rD.maxLevel, msgs: rD.messages?.map(m => m.message) }

  filewrite(results, 'reverse-mismatch')
  return { partId }
}
