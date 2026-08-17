// Test scale with factor = 1 (should be no-op)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleIdentityTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })).result

  // Dump graphic data before scale
  const beforeResp = await api.v1.common.getAppVersion({})
  filewrite(beforeResp.graphic, 'graphic-before')

  const r = await api.v1.solid.scale({ id: eifId, target: boxId, factor: 1 })
  console.log('[03] scale factor=1 result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'scale-1-response')

  // Dump graphic after to compare
  const afterResp = await api.v1.common.getAppVersion({})
  filewrite(afterResp.graphic, 'graphic-after')

  await snapshot('after-scale-1')

  return { partId, eifId, boxId }
}
