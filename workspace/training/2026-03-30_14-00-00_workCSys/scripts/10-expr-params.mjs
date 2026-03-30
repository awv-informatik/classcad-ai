// Test: expression strings in offset/rotation — do they work?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Try expression strings in offset
  const r1 = await api.v1.part.workCSys({
    id: partId, name: 'CS_expr_off',
    offset: ['10+20', '0', '0']
  })
  console.log('[10] expr offset result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[10] expr offset msgs:', JSON.stringify(r1.messages))

  // Try @expr references
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'offX', value: 50 }] })
  const r2 = await api.v1.part.workCSys({
    id: partId, name: 'CS_atexpr_off',
    offset: ['@expr.offX', '0', '0']
  })
  console.log('[10] @expr offset result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[10] @expr offset msgs:', JSON.stringify(r2.messages))

  // Try expression in rotation
  const r3 = await api.v1.part.workCSys({
    id: partId, name: 'CS_expr_rot',
    rotation: ['0', '0', '3.14/4']
  })
  console.log('[10] expr rotation result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[10] expr rotation msgs:', JSON.stringify(r3.messages))

  filewrite({
    exprOff: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    atExprOff: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    exprRot: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }
  }, 'expr-responses')

  return { partId }
}
