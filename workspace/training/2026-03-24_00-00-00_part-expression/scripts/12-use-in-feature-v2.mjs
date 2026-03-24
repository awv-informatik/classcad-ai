// Test: using expressions in box — try inline formula first, then named ref
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create expressions
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'L', value: 120 },
      { name: 'W', value: 80 },
    ],
  })

  // Test 1: inline formula string (should work per docs)
  const box1 = await api.v1.part.box({
    id: partId,
    name: 'InlineBox',
    length: '3*40',
    width: '2*40',
    height: '50+10',
  })
  console.log('[12] inline formula box:', box1.result, 'maxLevel:', box1.maxLevel)
  if (box1.messages?.length) console.log('[12] messages:', JSON.stringify(box1.messages))

  await snapshot('inline-box')

  return { partId }
}
