// 14 — Can we retrieve an entity injection by name using getWorkGeometry or similar?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GetByNameTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'MyEI' })).result
  console.log('[14] eifId:', eifId)

  // Try getWorkGeometry (which works for workPlane, workAxis, etc.)
  const gwR = await api.v1.part.getWorkGeometry({ id: partId, name: 'MyEI' })
  console.log('[14] getWorkGeometry result:', gwR.result, 'maxLevel:', gwR.maxLevel)
  console.log('[14] getWorkGeometry messages:', JSON.stringify(gwR.messages))
  filewrite({ result: gwR.result, messages: gwR.messages, maxLevel: gwR.maxLevel }, 'get-by-name')

  // Try getSketch (unlikely but let's see)
  const gsR = await api.v1.part.getSketch({ id: partId, name: 'MyEI' })
  console.log('[14] getSketch result:', gsR.result, 'maxLevel:', gsR.maxLevel)
  console.log('[14] getSketch messages:', JSON.stringify(gsR.messages))

  return { partId, eifId, getWgResult: gwR.result, getSkResult: gsR.result }
}
