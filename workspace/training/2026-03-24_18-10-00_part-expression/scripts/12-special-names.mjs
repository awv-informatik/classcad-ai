// Test expression names: special chars, spaces, collisions with function names
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Name with underscore (common)
  const r1 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'my_var', value: 10 }],
  })
  console.log('[12] underscore result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Name with digits
  const r2 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'var2', value: 20 }],
  })
  console.log('[12] digits result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Name colliding with math function
  const r3 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'sin', value: 42 }],
  })
  console.log('[12] "sin" name result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[12] "sin" messages:', JSON.stringify(r3.messages))

  // Name with spaces
  const r4 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'has space', value: 5 }],
  })
  console.log('[12] space name result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[12] space messages:', JSON.stringify(r4.messages))

  // Empty string name
  const r5 = await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: '', value: 5 }],
  })
  console.log('[12] empty name result:', r5.result, 'maxLevel:', r5.maxLevel)
  console.log('[12] empty messages:', JSON.stringify(r5.messages))

  // If sin was created, test if sin() function still works
  if (r3.result === 1) {
    const v = await api.v1.common.evaluateExpression({ expression: 'sin', id: 6 })
    console.log('[12] eval "sin" =', v.result)
    const v2 = await api.v1.common.evaluateExpression({ expression: 'sin(C:PI/2)', id: 6 })
    console.log('[12] eval "sin(C:PI/2)" =', v2.result, 'maxLevel:', v2.maxLevel)
  }

  return { partId }
}
