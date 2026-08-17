// Verify that slice modifies the target in place
// After slicing, the original boxId should reference the sliced solid
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceInPlace' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create a box
  const boxR = await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })
  const boxId = boxR.result
  console.log('[17] boxId:', boxId)

  // Get bbox before
  const cBefore = boxR.graphic?.containers?.find(c => c.owner === boxId)
  console.log('[17] BEFORE bbox:', JSON.stringify(cBefore?.properties?.min), JSON.stringify(cBefore?.properties?.max))

  // Slice
  const sliceR = await api.v1.solid.slice({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [0, 0, 1],
    keepBoth: false,
  })
  console.log('[17] slice result:', sliceR.result, '(VOID, as documented for keepBoth: false)')

  // Now try to use the original boxId in another operation (translate)
  // If the box is modified in place, this should move the sliced half
  const transR = await api.v1.solid.translation({
    id: eifId,
    target: boxId,
    translation: [0, 0, 30],
  })
  console.log('[17] translate result:', transR.result, 'maxLevel:', transR.maxLevel)

  const cAfter = transR.graphic?.containers?.find(c => c.owner === boxId)
  if (cAfter) {
    console.log('[17] AFTER translate bbox:', JSON.stringify(cAfter.properties?.min), JSON.stringify(cAfter.properties?.max))
  }

  // Create a reference cylinder for visual comparison
  await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 10, translation: [60, 0, 0] })
  await snapshot('after-translate-sliced')

  return { partId, boxId }
}
