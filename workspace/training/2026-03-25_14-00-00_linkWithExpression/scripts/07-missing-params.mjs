// Missing required params
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 100 }] })
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  // Missing exprName
  const r1 = await api.v1.part.linkWithExpression({ id: boxId, name: 'height' })
  console.log('[07] no exprName:', JSON.stringify(r1.result), 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) {
    for (const m of r1.messages) console.log('[07] msg:', m.level, m.code, m.message)
  }

  // Missing name
  const r2 = await api.v1.part.linkWithExpression({ id: boxId, exprName: 'H' })
  console.log('[07] no name:', JSON.stringify(r2.result), 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) {
    for (const m of r2.messages) console.log('[07] msg:', m.level, m.code, m.message)
  }

  // Missing id
  const r3 = await api.v1.part.linkWithExpression({ exprName: 'H', name: 'height' })
  console.log('[07] no id:', JSON.stringify(r3.result), 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) {
    for (const m of r3.messages) console.log('[07] msg:', m.level, m.code, m.message)
  }

  return { partId, boxId }
}
