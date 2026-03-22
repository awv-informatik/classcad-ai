// Q: Can a single API call return multiple messages? What ordering?
export default async function ({ execute }) {
  // Known to produce 3 messages: invalid ID on part.box
  const r1 = await execute({ 'v1.part.box': [{ id: 999999 }] })
  console.log('[17] multi-message response:')
  console.log('[17] count:', r1.messages.length)
  for (let i = 0; i < r1.messages.length; i++) {
    const m = r1.messages[i]
    console.log(`[17]   [${i}] level=${m.level}(${m.levelStr}) code=${m.code} api=${m.api}: ${m.message}`)
  }
  console.log('[17] ordering: warnings come before errors in the array')

  // Test with evaluateExpression — bad expression with id param pointing to invalid ID
  const r2 = await execute({ 'v1.common.evaluateExpression': [{ id: 999999, expression: 'bad!!!' }] })
  console.log('[17] expr with bad id + bad expr:')
  console.log('[17] count:', r2.messages.length)
  for (let i = 0; i < r2.messages.length; i++) {
    const m = r2.messages[i]
    console.log(`[17]   [${i}] level=${m.level}(${m.levelStr}) code=${m.code} api=${m.api}: ${m.message}`)
  }
}
