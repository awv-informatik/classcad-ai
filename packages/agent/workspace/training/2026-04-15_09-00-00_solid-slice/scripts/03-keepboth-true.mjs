// Test slice with keepBoth: TRUE (the default)
// The docs say this returns the ID of the new slice
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceKeepBoth' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create a box
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[03] boxId:', boxId)

  // Slice at z=20 with keepBoth explicitly TRUE
  console.log('[03] calling slice with keepBoth: true...')
  const r = await api.v1.solid.slice({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 20],
    normal: [0, 0, 1],
    keepBoth: true,
  })

  console.log('[03] slice result:', r.result)
  console.log('[03] maxLevel:', r.maxLevel)
  console.log('[03] original boxId:', boxId, '| returned:', r.result)
  console.log('[03] is new ID?', r.result !== boxId && r.result !== null)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel, boxId }, 'slice-keepboth-response')

  await snapshot('after-keepboth')

  return { partId, boxId, sliceResult: r.result }
}
