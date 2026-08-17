// Q: What does the message system look like on clean success? Are messages/maxLevel present or absent?
export default async function (api) {
  const r1 = await api.v1.common.getAppVersion({})
  console.log('[01] getAppVersion full:', JSON.stringify(r1, null, 2))
  console.log('[01] messages:', JSON.stringify(r1.messages))
  console.log('[01] maxLevel:', r1.maxLevel)

  const r2 = await api.v1.part.create({ name: 'Test' })
  console.log('[01] part.create full:', JSON.stringify({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }))
  console.log('[01] messages type:', typeof r2.messages, 'isArray:', Array.isArray(r2.messages), 'length:', r2.messages?.length)
}
