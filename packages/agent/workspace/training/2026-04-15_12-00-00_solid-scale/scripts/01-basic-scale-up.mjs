// Test basic scale with factor > 1 (enlarge)
// Include a reference body to verify visual scaling
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleUpTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Target box: 40x30x20 at origin
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
  // Reference body: small sphere offset, won't be scaled
  const refId = (await api.v1.solid.sphere({ id: eifId, radius: 10, translation: [80, 0, 0] })).result

  await snapshot('before-scale')

  // Dump graphic before
  const gBefore = await api.v1.solid.box({ id: eifId, length: 1, width: 1, height: 1 })
  // Actually let's use the current state's graphic
  const stateBefore = await api.v1.common.getAppVersion({})
  filewrite(stateBefore.graphic, 'graphic-before')

  // Scale box by factor 2
  const r = await api.v1.solid.scale({ id: eifId, target: boxId, factor: 2 })
  console.log('[01] scale result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'scale-response')

  await snapshot('after-scale-2x')

  return { partId, eifId, boxId, refId }
}
