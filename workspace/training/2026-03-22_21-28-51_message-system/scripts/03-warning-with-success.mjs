// Q: Can a call succeed (return valid result) but still have warning-level messages?
// Try: create a part, do something that might trigger warnings but still work
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Try creating a box with unusual but valid params
  const r1 = await api.v1.part.box({ id: partId, xLen: 0, yLen: 0, zLen: 0 })
  console.log('[03] zero-size box:', JSON.stringify({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, null, 2))

  // Negative dimensions
  const r2 = await api.v1.part.box({ id: partId, xLen: -10, yLen: 50, zLen: 50 })
  console.log('[03] negative xLen:', JSON.stringify({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, null, 2))

  // Very large dimensions
  const r3 = await api.v1.part.box({ id: partId, xLen: 1e12, yLen: 1e12, zLen: 1e12 })
  console.log('[03] huge box:', JSON.stringify({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, null, 2))
}
