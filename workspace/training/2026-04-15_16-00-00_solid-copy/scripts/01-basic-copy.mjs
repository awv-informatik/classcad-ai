// Basic copy — no translation, no rotation. Verify two solids exist at same position.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyBasic' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[01] original boxId:', boxId)

  await snapshot('before')

  const copyId = (await api.v1.solid.copy({ id: eifId, target: boxId })).result
  console.log('[01] copyId:', copyId)
  console.log('[01] copy is different ID:', copyId !== boxId)

  const r = await api.v1.solid.copy({ id: eifId, target: boxId })
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'copy-response')

  await snapshot('after')
  return { partId, eifId, boxId, copyId }
}
