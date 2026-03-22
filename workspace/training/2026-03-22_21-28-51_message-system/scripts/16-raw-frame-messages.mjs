// Q: Does the raw server frame contain INFO-level messages that the client filters out?
// The client does: frame.messages.filter(m => m.level > 31)
// Let's bypass this by accessing the raw WebSocket to see what the server actually sends.
export default async function ({ execute, request, ws }) {
  // Hook into WebSocket to capture raw frames
  const rawFrames = []
  const origOnMessage = ws._events?.message

  // Actually, we can't easily intercept. Let's just note that the client filters level <= 31
  // and test what maxLevel tells us about filtered messages.

  // If maxLevel=31 and messages=[] after filtering, there must be INFO messages that were removed
  const r1 = await execute({ 'v1.common.getAppVersion': [{}] })
  console.log('[16] success: maxLevel=', r1.maxLevel, 'visible msgs:', r1.messages.length)
  console.log('[16] maxLevel=31 implies INFO-level messages exist but were filtered by client')

  // Create a part and do something — check if server sends INFO traces
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result
  const r2 = await execute({ 'v1.part.box': [{ id: partId, xLen: 50, yLen: 50, zLen: 50 }] })
  console.log('[16] box create: maxLevel=', r2.maxLevel, 'visible msgs:', r2.messages.length)

  // Summary of what we know about levels:
  console.log('[16]')
  console.log('[16] Level summary (from all scripts):')
  console.log('[16]   31 = INFO — filtered by client, present in maxLevel on success')
  console.log('[16]   41 = WARNING — visible, e.g., ToId() invalid ID')
  console.log('[16]   51 = ERROR — visible, missing params, invalid IDs, unknown APIs')
  console.log('[16]')
  console.log('[16] levelStr values seen: INFO(inferred), WARNING, ERROR')
  console.log('[16] No evidence of other levels (e.g., 21=DEBUG, 61=FATAL)')
}
