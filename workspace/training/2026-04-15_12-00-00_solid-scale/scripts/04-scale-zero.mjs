// Test scale with factor = 0 (degenerate case)
// Does it error? Silently produce degenerate geometry?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleZeroTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })).result

  const r = await api.v1.solid.scale({ id: eifId, target: boxId, factor: 0 })
  console.log('[04] scale factor=0 result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'scale-0-response')

  await snapshot('after-scale-0')

  return { partId, eifId, boxId }
}
