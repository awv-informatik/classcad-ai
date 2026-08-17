// Test: USERDEFINED workAxis with expression-linked position/direction
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create expressions for position components
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'posX', value: 30 },
      { name: 'posY', value: 0 },
      { name: 'posZ', value: 20 },
    ]
  })

  // Try @expr references in position array
  const r1 = await api.v1.part.workAxis({
    id: partId,
    name: 'WA_atexpr',
    position: ['@expr.posX', '@expr.posY', '@expr.posZ'],
    direction: [0, 0, 1]
  })
  console.log('[03] @expr result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[03] @expr messages:', JSON.stringify(r1.messages))

  // Try inline formula in position array
  const r2 = await api.v1.part.workAxis({
    id: partId,
    name: 'WA_inline',
    position: ['10+20', '0', '0'],
    direction: [1, 0, 0]
  })
  console.log('[03] inline result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[03] inline messages:', JSON.stringify(r2.messages))

  filewrite({
    atexpr: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel },
    inline: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }
  }, 'expr-responses')

  return { partId }
}
