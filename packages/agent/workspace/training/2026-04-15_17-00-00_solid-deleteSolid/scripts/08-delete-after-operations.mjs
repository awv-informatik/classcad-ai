// Test: delete a solid that was used in operations (after copy, after transform)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DeleteAfterOps' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create a box, copy it, then delete the original
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const copyId = (await api.v1.solid.copy({ id: eifId, target: boxId, translation: [80, 0, 0] })).result
  console.log('[08] boxId:', boxId, 'copyId:', copyId)

  await snapshot('before-delete-original')

  // Delete the original, keep the copy
  const r = await api.v1.solid.deleteSolid({ id: eifId, ids: [boxId] })
  console.log('[08] delete original — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'delete-original-response')

  await snapshot('after-delete-original')

  // Can we still operate on the copy?
  const r2 = await api.v1.solid.translation({ id: eifId, target: copyId, translation: [0, 50, 0] })
  console.log('[08] translate copy — result:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('copy-translated')

  return { partId, eifId, copyId }
}
