// Test: using named expression references in feature params
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create expressions
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'L', value: 120 },
      { name: 'W', value: 80 },
      { name: 'H', value: 60 },
    ],
  })

  // Try named ref: just the name as a string
  const box1 = await api.v1.part.box({
    id: partId,
    name: 'NamedBox',
    length: 'L',
    width: 'W',
    height: 'H',
  })
  console.log('[13] named ref (bare):', box1.result, 'maxLevel:', box1.maxLevel)
  if (box1.maxLevel > 31) console.log('[13] messages:', JSON.stringify(box1.messages?.map(m => m.message.substring(0, 120))))

  // If that failed, try with formula syntax referencing the names
  if (!box1.result || box1.maxLevel > 40) {
    const box2 = await api.v1.part.box({
      id: partId,
      name: 'NamedBox2',
      length: 'L + 0',
      width: 'W + 0',
      height: 'H + 0',
    })
    console.log('[13] named ref (formula):', box2.result, 'maxLevel:', box2.maxLevel)
    if (box2.maxLevel > 31) console.log('[13] messages:', JSON.stringify(box2.messages?.map(m => m.message.substring(0, 120))))
  }

  await snapshot('named-ref-box')

  return { partId }
}
