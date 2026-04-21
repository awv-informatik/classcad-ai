export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 20, height: 60, position: [50, 0, 0] })).result
  console.log('[09] boxId:', boxId, 'cylId:', cylId)

  await snapshot('before')

  // Pass a mix of valid and invalid IDs — does it delete the valid ones or reject the whole call?
  const r = await api.v1.part.deleteFeature({ ids: [boxId, 999999, cylId] })
  console.log('[09] mixed valid+invalid — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[09] messages:', JSON.stringify(r.messages))

  // Check what survived
  const boxCheck = await api.v1.part.getFeature({ id: partId, name: 'Box' })
  const cylCheck = await api.v1.part.getFeature({ id: partId, name: 'Cylinder' })
  console.log('[09] box survived:', boxCheck.result !== null, 'cyl survived:', cylCheck.result !== null)

  await snapshot('after-mixed')

  filewrite({
    response: { result: r.result, maxLevel: r.maxLevel, messages: r.messages },
    survivors: { box: boxCheck.result, cyl: cylCheck.result },
  }, 'mixed-response')

  return { partId }
}
