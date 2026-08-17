export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

  // Before update
  const rBefore = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[16] before update:', JSON.stringify(rBefore.result))

  // Update box dimensions: 120 x 80 x 60 => vol = 576000
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, length: 120, width: 80, height: 60 })
  await api.v1.part.closeFeature({ id: boxId })

  // After update
  const rAfter = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[16] after update:', JSON.stringify(rAfter.result))

  filewrite({
    before: rBefore.result,
    after: rAfter.result,
  }, 'after-update')

  console.log('[16] expected before: vol=72000, cog=[30,20,15]')
  console.log('[16] expected after: vol=576000, cog=[60,40,30]')

  return { partId }
}
