// Missing required params
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  const r1 = await api.v1.part.unlinkExpression({ id: boxId })
  console.log('[06] no name:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) {
    for (const m of r1.messages) console.log('[06] msg:', m.level, m.code, m.message)
  }

  const r2 = await api.v1.part.unlinkExpression({ name: 'height' })
  console.log('[06] no id:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) {
    for (const m of r2.messages) console.log('[06] msg:', m.level, m.code, m.message)
  }

  return { partId, boxId }
}
