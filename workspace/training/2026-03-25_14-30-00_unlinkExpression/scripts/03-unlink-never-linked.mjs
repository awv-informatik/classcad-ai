// Unlink a param that was never linked (created with plain value)
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({
    id: partId, length: 80, width: 60, height: 40,
  })).result

  const ur = await api.v1.part.unlinkExpression({ id: boxId, name: 'height' })
  console.log('[03] unlink never-linked result:', JSON.stringify(ur.result), 'maxLevel:', ur.maxLevel)
  if (ur.messages?.length) {
    for (const m of ur.messages) console.log('[03] msg:', m.level, m.code, m.message)
  }

  return { partId, boxId }
}
