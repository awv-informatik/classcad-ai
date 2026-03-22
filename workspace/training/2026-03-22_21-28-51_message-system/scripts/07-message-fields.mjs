// Q: What fields does each message have? Are they consistent across different error types?
export default async function ({ execute }) {
  // Error 1: unknown API
  const r1 = await execute({ 'v1.fake.method': [{}] })
  console.log('[07] unknown API message fields:', JSON.stringify(r1.messages[0]))

  // Error 2: missing param
  const r2 = await execute({ 'v1.part.box': [{}] })
  console.log('[07] missing param message fields:', JSON.stringify(r2.messages[0]))

  // Error 3: bad expression
  const r3 = await execute({ 'v1.common.evaluateExpression': [{ expression: '1/0' }] })
  console.log('[07] div by zero:', JSON.stringify({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }))

  // Error 4: valid expression
  const r4 = await execute({ 'v1.common.evaluateExpression': [{ expression: '2+3' }] })
  console.log('[07] valid expr:', JSON.stringify({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }))

  // Check all keys present in each message
  for (const [label, msgs] of [['unknown', r1.messages], ['missing', r2.messages], ['divzero', r3.messages]]) {
    for (const m of msgs) {
      console.log(`[07] ${label} keys:`, Object.keys(m).sort().join(', '))
    }
  }
}
