// 13 — Are useSolid returned IDs the same as original solid IDs, or new copies?
// Also: verify with structure tree what the relationship is.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IDCheck' })).result

  // Create source EI with a box
  const srcEif = (await api.v1.part.entityInjection({ id: partId, name: 'SrcEI' })).result
  const origBox = (await api.v1.solid.box({ id: srcEif, length: 60, width: 40, height: 30 })).result
  console.log('[13] original box ID:', origBox)

  // Dump structure before useSolid
  const beforeStruct = (await api.v1.common.getAppVersion({}))
  // Actually, let's get the structure from a dummy call
  const structBefore = (await api.v1.solid.box({ id: srcEif, length: 1, width: 1, height: 1, translation: [200, 200, 200] }))
  filewrite(structBefore.structure, 'structure-before')
  // Delete the tiny box
  await api.v1.solid.deleteSolid({ id: srcEif, ids: [structBefore.result] })

  // Create dest EI and useSolid
  const dstEif = (await api.v1.part.entityInjection({ id: partId, name: 'DstEI' })).result
  const r = await api.v1.solid.useSolid({ from: [{ id: srcEif, indices: [0] }], in: dstEif })
  console.log('[13] useSolid result:', r.result, 'maxLevel:', r.maxLevel)

  const usedId = r.result[0]
  console.log('[13] original box ID:', origBox, '| useSolid returned ID:', usedId)
  console.log('[13] same ID?', origBox === usedId)

  // Dump structure after useSolid
  filewrite(r.structure, 'structure-after')

  // Try to operate on the ORIGINAL box ID — does it still work?
  const tryOrig = await api.v1.solid.translation({ id: srcEif, target: origBox, translation: [0, 0, 50] })
  console.log('[13] translate original box result:', tryOrig.result, 'maxLevel:', tryOrig.maxLevel)
  console.log('[13] translate original messages:', JSON.stringify(tryOrig.messages))

  // Try to operate on the useSolid'd ID
  const tryUsed = await api.v1.solid.translation({ id: dstEif, target: usedId, translation: [100, 0, 0] })
  console.log('[13] translate useSolid ID result:', tryUsed.result, 'maxLevel:', tryUsed.maxLevel)

  filewrite({
    origBoxId: origBox,
    usedId: usedId,
    sameId: origBox === usedId,
    origTranslateOk: tryOrig.maxLevel <= 31,
    usedTranslateOk: tryUsed.maxLevel <= 31,
    origMessages: tryOrig.messages,
    usedMessages: tryUsed.messages
  }, 'id-comparison')

  await snapshot('id-check')
  return { origBox, usedId, sameId: origBox === usedId }
}
