// silent param — suppress error messages
export default async function (api) {
  // Without silent (default FALSE)
  const r1 = await api.v1.common.evaluateExpression({ expression: 'INVALID' })
  console.log('[06] no silent → result:', r1.result, 'maxLevel:', r1.maxLevel, 'msgCount:', r1.messages.length)

  // With silent: true
  const r2 = await api.v1.common.evaluateExpression({ expression: 'INVALID', silent: true })
  console.log('[06] silent:true → result:', r2.result, 'maxLevel:', r2.maxLevel, 'msgCount:', r2.messages.length)

  // With silent: false (explicit)
  const r3 = await api.v1.common.evaluateExpression({ expression: 'INVALID', silent: false })
  console.log('[06] silent:false → result:', r3.result, 'maxLevel:', r3.maxLevel, 'msgCount:', r3.messages.length)

  // Silent on valid expression — any difference?
  const r4 = await api.v1.common.evaluateExpression({ expression: '2+3', silent: true })
  console.log('[06] valid+silent → result:', r4.result, 'maxLevel:', r4.maxLevel)
}
