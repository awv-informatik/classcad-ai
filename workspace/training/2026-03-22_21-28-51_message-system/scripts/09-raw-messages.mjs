// Q: What levels exist below 31 that the client filters? Let's bypass the filter.
// The client filters m.level > 31. Let's modify execute to keep all messages.
export default async function ({ execute, request }) {
  // Use request() directly which returns the raw frame — but the client still filters.
  // Instead, let's just call a success + error and see if there are other levels above 31.

  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result

  // Try multiple operations that might produce different warning levels
  // setDatabaseSettings with unusual values
  const r1 = await execute({ 'v1.common.setDatabaseSettings': [{ lengthUnit: 'INVALID' }] })
  console.log('[09] invalid lengthUnit:', JSON.stringify({ msgs: r1.messages, maxLevel: r1.maxLevel }))

  // Try loading a non-existent file
  const r2 = await execute({ 'v1.common.load': [{ path: '/nonexistent/file.ofb' }] })
  console.log('[09] load nonexistent:', JSON.stringify({ result: r2.result, msgs: r2.messages, maxLevel: r2.maxLevel }, null, 2))

  // Try saving to an invalid path
  const r3 = await execute({ 'v1.common.save': [{ format: 'INVALID' }] })
  console.log('[09] save invalid format:', JSON.stringify({ result: r3.result, msgs: r3.messages, maxLevel: r3.maxLevel }, null, 2))

  // Collect unique levels
  const allMsgs = [...r1.messages, ...r2.messages, ...r3.messages]
  const levels = [...new Set(allMsgs.map(m => m.level))].sort((a, b) => a - b)
  console.log('[09] unique levels:', levels)
  console.log('[09] unique levelStrs:', [...new Set(allMsgs.map(m => m.levelStr))])
}
