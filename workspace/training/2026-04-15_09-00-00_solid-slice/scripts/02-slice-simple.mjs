// Simpler slice test — no snapshot before, minimal setup
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceSimple' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create a box
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[02] boxId:', boxId)

  // Slice at z=20 with normal [0,0,1], keepBoth: FALSE
  console.log('[02] calling slice...')
  const r = await api.v1.solid.slice({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 20],
    normal: [0, 0, 1],
    keepBoth: false,
  })

  console.log('[02] slice result:', r.result)
  console.log('[02] maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'slice-response')

  await snapshot('after-slice')

  return { partId, boxId, sliceResult: r.result }
}
