// Confirm: bare expression names (without @expr.) fail in feature params
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'L', value: 80 }],
  })

  // Bare name — should fail
  const r1 = await api.v1.part.box({
    id: partId,
    name: 'BareBox',
    length: 'L',
  })
  console.log('[04] bare "L" result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.maxLevel > 31) console.log('[04] messages:', JSON.stringify(r1.messages))

  // Bare name with arithmetic — should also fail
  const r2 = await api.v1.part.box({
    id: partId,
    name: 'BareBox2',
    length: 'L + 10',
  })
  console.log('[04] bare "L + 10" result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.maxLevel > 31) console.log('[04] messages:', JSON.stringify(r2.messages))

  // @expr. version — should work
  const r3 = await api.v1.part.box({
    id: partId,
    name: 'ExprBox',
    length: '@expr.L',
  })
  console.log('[04] "@expr.L" result:', r3.result, 'maxLevel:', r3.maxLevel)

  return { partId }
}
