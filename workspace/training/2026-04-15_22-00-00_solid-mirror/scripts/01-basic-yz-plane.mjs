// Basic mirror across YZ plane (normal=[1,0,0], origin=[0,0,0])
// Question: Does mirror create a new solid or modify in place? What does it return?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create an asymmetric box offset from origin so mirror is visible
  const boxId = (await api.v1.solid.box({
    id: eifId,
    length: 80,
    width: 40,
    height: 30,
    translation: [20, 10, 0],
  })).result
  console.log('[01] boxId:', boxId)

  // Add a small reference body at origin to anchor the view
  const refId = (await api.v1.solid.cylinder({
    id: eifId,
    height: 10,
    diameter: 8,
  })).result
  console.log('[01] refId:', refId)

  await snapshot('before-mirror')

  // Dump graphic data before mirror
  const gBefore = await api.v1.solid.box({ id: eifId, length: 1, width: 1, height: 1 })
  // Actually let's just get structure before
  filewrite({ boxId, refId }, 'ids')

  // Mirror the box across YZ plane (normal=[1,0,0] at origin)
  const r = await api.v1.solid.mirror({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [1, 0, 0],
  })

  console.log('[01] mirror result:', r.result)
  console.log('[01] mirror maxLevel:', r.maxLevel)
  console.log('[01] mirror messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'mirror-response')

  await snapshot('after-mirror')

  return { partId, eifId, boxId, mirrorResult: r.result }
}
