// Q: Is levelStr always consistent? "WARNING" vs "WARN" seen in script 17.
export default async function ({ execute }) {
  // Provoke warnings from different APIs
  const r1 = await execute({ 'v1.part.box': [{ id: 999999 }] })
  const r2 = await execute({ 'v1.common.setObjectName': [{ id: 999999, name: 'x' }] })
  const r3 = await execute({ 'v1.common.evaluateExpression': [{ id: 999999, expression: 'bad' }] })

  console.log('[18] warning levelStr values:')
  for (const [label, r] of [['part.box', r1], ['setObjectName', r2], ['evaluateExpression', r3]]) {
    for (const m of r.messages) {
      if (m.level === 41) {
        console.log(`  ${label}: levelStr="${m.levelStr}" level=${m.level} api=${m.api}`)
      }
    }
  }

  // Also check error levelStr consistency
  console.log('[18] error levelStr values:')
  for (const [label, r] of [['part.box', r1], ['setObjectName', r2], ['evaluateExpression', r3]]) {
    for (const m of r.messages) {
      if (m.level === 51) {
        console.log(`  ${label}: levelStr="${m.levelStr}" level=${m.level}`)
      }
    }
  }
}
