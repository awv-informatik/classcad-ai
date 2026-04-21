export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ErrTest' })).result

  // Error 1: No data, no url, no file
  const r1 = await api.v1.part.importFeature({ id: partId, format: 'STP', name: 'NoData' })
  console.log('[08-a] no data result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[08-a] messages:', JSON.stringify(r1.messages))

  // Error 2: Invalid data
  const r2 = await api.v1.part.importFeature({ id: partId, data: 'not-valid-stp-data', format: 'STP', name: 'BadData' })
  console.log('[08-b] bad data result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[08-b] messages:', JSON.stringify(r2.messages))

  // Error 3: Non-existent file
  const r3 = await api.v1.part.importFeature({ id: partId, file: '/tmp/nonexistent-file.stp', name: 'NoFile' })
  console.log('[08-c] missing file result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[08-c] messages:', JSON.stringify(r3.messages))

  // Error 4: Wrong format string
  const r4 = await api.v1.part.importFeature({ id: partId, data: 'test', format: 'INVALID', name: 'BadFormat' })
  console.log('[08-d] bad format result:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages?.length) console.log('[08-d] messages:', JSON.stringify(r4.messages))

  filewrite({
    noData: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    badData: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    noFile: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    badFormat: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'error-responses')

  return {}
}
