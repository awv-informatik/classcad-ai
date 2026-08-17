// 08 — Large negative distance: should cause topology collapse (box 60x40x30, offset -20 = edges collide)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LargeOffset' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[08] boxId:', boxId)

  // -20 offset on a 30-tall box: faces will try to pass through each other
  const r = await api.v1.solid.offset({ id: eifId, target: boxId, distance: -20 })
  console.log('[08] large neg offset result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'large-neg-response')

  await snapshot('after-large-neg')

  return { boxId, result: r.result }
}
