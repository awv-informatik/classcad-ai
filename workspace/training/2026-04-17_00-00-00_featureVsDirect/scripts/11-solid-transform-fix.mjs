export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SolidTransform' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  const solidBoxId = (await api.v1.solid.box({
    id: eifId, length: 80, width: 60, height: 40,
  })).result

  // Add a reference box that won't move
  const refBoxId = (await api.v1.solid.box({
    id: eifId, length: 20, width: 20, height: 20,
    translation: [-30, 0, 0],
  })).result

  await snapshot('before-transform')

  // solid.translation uses `target` (singular), not `targets`
  const transR = await api.v1.solid.translation({
    id: eifId, target: solidBoxId, translation: [0, 0, 50],
  })
  console.log('[11] solid.translation result:', transR.result, 'maxLevel:', transR.maxLevel)
  filewrite({ result: transR.result, messages: transR.messages, maxLevel: transR.maxLevel }, 'solid-translation-result')

  await snapshot('after-translation')

  // Also try solid.rotation
  const rotR = await api.v1.solid.rotation({
    id: eifId, target: solidBoxId, rotation: [0, 0, Math.PI / 6],
  })
  console.log('[11] solid.rotation result:', rotR.result, 'maxLevel:', rotR.maxLevel)
  filewrite({ result: rotR.result, messages: rotR.messages, maxLevel: rotR.maxLevel }, 'solid-rotation-result')

  await snapshot('after-rotation')

  return { partId, eifId, solidBoxId }
}
