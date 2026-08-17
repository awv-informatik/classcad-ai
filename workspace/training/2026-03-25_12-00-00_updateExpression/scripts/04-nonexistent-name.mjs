// Test updating a non-existent expression name
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'exists', value: 10 }],
  })

  // Try to update a name that doesn't exist
  const ur = await api.v1.part.updateExpression({
    id: partId,
    toUpdate: [{ name: 'doesNotExist', value: 999 }],
  })
  console.log('[04] nonexistent result:', ur.result, 'maxLevel:', ur.maxLevel)
  if (ur.messages?.length) {
    for (const m of ur.messages) {
      console.log('[04] msg:', m.level, m.code, m.message)
    }
  }

  // Check that 'exists' was NOT affected
  const check = await api.v1.part.getExpression({ id: partId, name: 'exists' })
  console.log('[04] exists still:', JSON.stringify(check.result))

  // Check if 'doesNotExist' was created as a side effect
  const check2 = await api.v1.part.getExpression({ id: partId, name: 'doesNotExist' })
  console.log('[04] doesNotExist:', JSON.stringify(check2.result))

  return { partId }
}
