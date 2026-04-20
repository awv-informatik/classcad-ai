export default async function (api, { filewrite }) {
  // Error case 1: nonexistent ID
  const r1 = await api.v1.common.getUserDataKeys({ id: 9999 })
  console.log('[07] nonexistent id=9999:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)
  console.log('[07]   messages:', JSON.stringify(r1.messages))

  // Error case 2: id=0
  const r2 = await api.v1.common.getUserDataKeys({ id: 0 })
  console.log('[07] id=0:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)
  console.log('[07]   messages:', JSON.stringify(r2.messages))

  // Error case 3: missing id param entirely
  const r3 = await api.v1.common.getUserDataKeys({})
  console.log('[07] missing id:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)
  console.log('[07]   messages:', JSON.stringify(r3.messages))

  // Error case 4: string id
  const r4 = await api.v1.common.getUserDataKeys({ id: 'not-a-real-id' })
  console.log('[07] string id:', JSON.stringify(r4.result), 'maxLevel:', r4.maxLevel)
  console.log('[07]   messages:', JSON.stringify(r4.messages))

  filewrite({
    nonexistent: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    zero: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel },
    missing: { result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel },
    string: { result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }
  }, 'errors')

  return {}
}
