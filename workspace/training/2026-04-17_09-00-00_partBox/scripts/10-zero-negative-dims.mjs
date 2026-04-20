export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeCaseTest' })).result

  // Test zero length
  const r1 = await api.v1.part.box({ id: partId, name: 'ZeroLength', length: 0, width: 50, height: 50 })
  console.log('[10] zero length - result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[10] zero length - messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'zero-length-response')

  // Test negative height
  const r2 = await api.v1.part.box({ id: partId, name: 'NegHeight', length: 50, width: 50, height: -30 })
  console.log('[10] neg height - result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[10] neg height - messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'neg-height-response')

  // Test all zero
  const r3 = await api.v1.part.box({ id: partId, name: 'AllZero', length: 0, width: 0, height: 0 })
  console.log('[10] all zero - result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'all-zero-response')

  await snapshot('edge-cases')
  return { partId }
}
