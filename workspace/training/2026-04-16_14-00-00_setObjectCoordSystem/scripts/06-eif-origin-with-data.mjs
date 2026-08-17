// Verify EIF origin shift numerically — dump graphic data before/after
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EIFOriginData' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[06] partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Save before state as STEP to compare geometry positions
  const saveBefore = (await api.v1.common.save({ format: 'STP', encoding: 'base64' })).result
  filewrite(saveBefore.content, 'step-before')

  // Set origin shift on EIF
  const r = await api.v1.common.setObjectCoordSystem({
    id: eifId,
    origin: [200, 300, 100],
    xVec: [1, 0, 0],
    yVec: [0, 1, 0],
  })
  console.log('[06] setObjectCoordSystem on EIF result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  // Save after state
  const saveAfter = (await api.v1.common.save({ format: 'STP', encoding: 'base64' })).result
  filewrite(saveAfter.content, 'step-after')

  // Compare: are the STEP files different?
  const different = saveBefore.content !== saveAfter.content
  console.log('[06] STEP files differ:', different)
  console.log('[06] STEP before length:', saveBefore.content.length, 'after:', saveAfter.content.length)

  return { partId, eifId, boxId, stepsDiffer: different }
}
