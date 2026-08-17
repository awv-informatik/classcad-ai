// 07 — keepIds with invalid/nonexistent IDs
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvalidKeep' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[07] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Clear with nonexistent ID
  const r1 = await api.v1.common.clear({ keepIds: [999999] })
  console.log('[07] keepIds=[999999] — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[07] messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'keep-invalid')

  // Everything should be gone now
  const partId2 = (await api.v1.part.create({ name: 'AfterInvalid' })).result
  console.log('[07] new partId after clear with invalid keepIds:', partId2)

  return { partId2 }
}
