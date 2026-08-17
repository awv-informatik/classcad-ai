// 16 — invalid keepIds: does error state prevent subsequent operations?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  console.log('[16] initial partId:', partId)

  // Clear with invalid keepIds — expect error
  const r = await api.v1.common.clear({ keepIds: [999999] })
  console.log('[16] clear invalid — result:', r.result, 'maxLevel:', r.maxLevel)

  // Try part.create — previously returned null
  const partR = await api.v1.part.create({ name: 'After' })
  console.log('[16] part.create — result:', partR.result, 'maxLevel:', partR.maxLevel)
  console.log('[16] part.create messages:', JSON.stringify(partR.messages))

  // If null, try a second clear with valid params
  if (partR.result === null) {
    const r2 = await api.v1.common.clear({})
    console.log('[16] recovery clear — result:', r2.result, 'maxLevel:', r2.maxLevel)

    const partR2 = await api.v1.part.create({ name: 'Recovered' })
    console.log('[16] recovered part.create — result:', partR2.result, 'maxLevel:', partR2.maxLevel)
    console.log('[16] recovered messages:', JSON.stringify(partR2.messages))
  }

  return {}
}
