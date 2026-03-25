// Re-test undocumented functions WITHOUT silent, and using part.expression to see actual values
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Test via evaluateExpression without silent
  const probes = [
    'ceil(2.3)', 'floor(2.7)', 'round(2.5)', 'trunc(2.7)',
    'cbrt(27)', 'hypot(3, 4)', 'log2(8)', 'log10(100)',
    'clamp(5, 0, 10)', 'lerp(0, 100, 0.5)', 'step(0.5, 0.3)',
    'mod(10, 3)', 'rem(10, 3)', 'int(3.7)', 'float(3)',
  ]

  for (const expr of probes) {
    const r = await api.v1.common.evaluateExpression({ expression: expr })
    console.log(`[24] '${expr}' = ${r.result} maxLevel:${r.maxLevel}`)
    if (r.messages?.length) {
      for (const m of r.messages) console.log(`[24]   msg: ${m.message.substring(0, 80)}`)
    }
  }

  // Also test via part.expression to get actual stored values
  const exprTests = [
    { name: 'tCeil', value: 'ceil(2.3)' },
    { name: 'tFloor', value: 'floor(2.7)' },
    { name: 'tRound', value: 'round(2.5)' },
    { name: 'tCbrt', value: 'cbrt(27)' },
    { name: 'tHypot', value: 'hypot(3, 4)' },
    { name: 'tLog2', value: 'log2(8)' },
    { name: 'tLog10', value: 'log10(100)' },
  ]

  const cr = await api.v1.part.expression({ id: partId, toCreate: exprTests })
  console.log('[24] create result:', cr.result, 'maxLevel:', cr.maxLevel)
  if (cr.messages?.length) {
    for (const m of cr.messages) console.log(`[24]   msg: ${m.message.substring(0, 100)}`)
  }

  for (const { name } of exprTests) {
    const r = await api.v1.part.getExpression({ id: partId, name })
    console.log(`[24] ${name} = ${r.result.value}`)
  }

  return { partId }
}
