export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateTest' })).result

  // Feature box — can be updated
  const featBoxId = (await api.v1.part.box({
    id: partId, name: 'FeatBox', length: 80, width: 60, height: 40,
  })).result

  await snapshot('before-update')

  // Update feature box via open/close
  await api.v1.part.openFeature({ id: featBoxId })
  const updateR = await api.v1.part.updateBox({ id: featBoxId, height: 120 })
  await api.v1.part.closeFeature({ id: featBoxId })
  console.log('[02] updateBox result:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'update-feat-result')

  await snapshot('after-feat-update')

  // Now solid box — no update API exists. Try solid.translation as workaround
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const solidBoxId = (await api.v1.solid.box({
    id: eifId, length: 50, width: 50, height: 50,
    translation: [100, 0, 0],
  })).result

  // Try transforming the solid after creation
  const transR = await api.v1.solid.translation({
    id: eifId, targets: [solidBoxId], translation: [0, 50, 0],
  })
  console.log('[02] solid.translation result:', transR.result, 'maxLevel:', transR.maxLevel)
  filewrite({ result: transR.result, messages: transR.messages, maxLevel: transR.maxLevel }, 'solid-translate-result')

  await snapshot('after-solid-translate')

  return { partId, featBoxId, eifId, solidBoxId }
}
