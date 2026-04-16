// 01 — Basic section of a box at the midpoint (XY plane at z=0)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SectionBasic' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Box centered at origin: spans [-40,40] x [-30,30] x [-20,20]
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[01] boxId:', boxId)

  await snapshot('before')

  // Section at z=0 (XY plane through the middle)
  const r = await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [0, 0, 1],
  })

  console.log('[01] section result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'section-response')

  await snapshot('after')

  return { partId, eifId, boxId, sectionResult: r.result }
}
