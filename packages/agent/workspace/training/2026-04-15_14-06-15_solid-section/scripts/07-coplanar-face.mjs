// 07 — Edge case: section plane coplanar with a box face
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SectionCoplanar' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Box: [-40,40] x [-30,30] x [-20,20]
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  // Section at z=20 — exactly the top face of the box
  const r1 = await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 20],
    normal: [0, 0, 1],
  })

  console.log('[07] coplanar-top result:', r1.result)
  console.log('[07] coplanar-top maxLevel:', r1.maxLevel)
  console.log('[07] coplanar-top messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'response-top')

  // Section at z=-20 — exactly the bottom face
  const r2 = await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, -20],
    normal: [0, 0, 1],
  })

  console.log('[07] coplanar-bottom result:', r2.result)
  console.log('[07] coplanar-bottom maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'response-bottom')

  await snapshot('after')

  return { partId, eifId, boxId }
}
