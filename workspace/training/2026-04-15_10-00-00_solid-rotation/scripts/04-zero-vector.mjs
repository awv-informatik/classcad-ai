// Test rotation with zero vector [0,0,0] — should be a no-op
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ZeroTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 20 })).result
  const refId = (await api.v1.solid.sphere({ id: eifId, radius: 10, translation: [-40, -40, 0] })).result

  await snapshot('before')

  const r = await api.v1.solid.rotation({ id: eifId, target: boxId, rotation: [0, 0, 0] })
  console.log('[04] zero rotation result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'zero-rotation')

  await snapshot('after-zero')
  return { boxId }
}
