// Q: Why does updateBox fail with the correct box feature ID? Debug full response.
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1' })).result
  console.log('[04] partId:', partId, 'boxId:', boxId)

  // Try updateBox with feature ID — full response
  const r1 = await api.v1.part.updateBox({ id: boxId, length: 50 })
  console.log('[04] updateBox full:', JSON.stringify({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, null, 2))

  // Maybe updateBox returns the same ID on success? Let me try with just name change
  const r2 = await api.v1.part.updateBox({ id: boxId, name: 'UpdatedBox' })
  console.log('[04] updateBox name:', JSON.stringify({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, null, 2))
}
