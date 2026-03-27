// Can you make multiple update calls within one open/close session?
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'MultiUpdate' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 10, height: 20 })).result

  await snapshot('before')

  // Open box, update multiple params in sequence
  await api.v1.part.openFeature({ id: boxId })
  const r1 = await api.v1.part.updateBox({ id: boxId, height: 120 })
  console.log('[09] first update (height) result:', r1.result, 'maxLevel:', r1.maxLevel)
  const r2 = await api.v1.part.updateBox({ id: boxId, width: 120 })
  console.log('[09] second update (width) result:', r2.result, 'maxLevel:', r2.maxLevel)
  const r3 = await api.v1.part.updateBox({ id: boxId, length: 20 })
  console.log('[09] third update (length) result:', r3.result, 'maxLevel:', r3.maxLevel)
  await api.v1.part.closeFeature({ id: boxId })

  await snapshot('after-multi-update')

  return { partId, boxId }
}
