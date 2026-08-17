// Test mismatched format — save as OFB, load claiming STP
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MismatchTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Save as OFB
  const saved = await api.v1.common.save({
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })

  await api.v1.common.clear({})

  // Try loading OFB data but claim it's STP
  console.log('[13] Loading OFB data as STP...')
  const loadR = await api.v1.common.load({
    data: saved.result.content,
    format: 'STP',
    encoding: 'base64',
    compression: 'deflate',
  })
  console.log('[13] Mismatch result:', JSON.stringify(loadR.result))
  console.log('[13] Mismatch maxLevel:', loadR.maxLevel)
  console.log('[13] Mismatch messages:', JSON.stringify(loadR.messages))

  filewrite({ result: loadR.result, maxLevel: loadR.maxLevel, messages: loadR.messages }, 'mismatch-response')

  return {}
}
