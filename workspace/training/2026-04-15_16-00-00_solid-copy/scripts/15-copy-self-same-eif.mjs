// Copy a solid within the same EIF without any transform (overlapping copy)
// Then verify both IDs are valid and the copy can be independently translated
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopySame' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 30, height: 20 })).result

  // Copy with no transform — creates overlapping duplicate
  const copyId = (await api.v1.solid.copy({ id: eifId, target: boxId })).result
  console.log('[15] original:', boxId, 'copy:', copyId)

  // Now translate the copy away to separate them
  const transR = await api.v1.solid.translation({ id: eifId, target: copyId, translation: [70, 0, 0] })
  console.log('[15] translation result:', transR.result, 'maxLevel:', transR.maxLevel)

  // Also rotate original to show they're independent
  const rotR = await api.v1.solid.rotation({ id: eifId, target: boxId, rotation: [0, 0, Math.PI / 6] })
  console.log('[15] rotation result:', rotR.result, 'maxLevel:', rotR.maxLevel)

  filewrite({ boxId, copyId, transResult: transR.result, rotResult: rotR.result }, 'ids')
  await snapshot('separated')
  return { partId, eifId }
}
