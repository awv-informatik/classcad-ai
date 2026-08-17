// Test basic slice with keepBoth: TRUE (default)
// Slice a box in half along Z at mid-height
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceBasic' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create a box: 80x60x40, offset so the cut is visible
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[01] boxId:', boxId)

  await snapshot('before')

  // Slice at z=20 with normal [0,0,1] — removes the part below the plane (negative side of normal)
  const r = await api.v1.solid.slice({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 20],
    normal: [0, 0, 1],
    // keepBoth defaults to TRUE
  })

  console.log('[01] slice result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  console.log('[01] boxId was:', boxId, '| slice returned:', r.result)
  console.log('[01] same as boxId?', r.result === boxId)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'slice-response')

  await snapshot('after-keepboth-true')

  return { partId, boxId, sliceResult: r.result }
}
