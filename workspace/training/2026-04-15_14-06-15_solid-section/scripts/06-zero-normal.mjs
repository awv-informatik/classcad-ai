// 06 — Edge case: zero normal vector [0,0,0]
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SectionZeroNormal' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  const r = await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [0, 0, 0],
  })

  console.log('[06] zero-normal result:', r.result)
  console.log('[06] maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  await snapshot('after')

  return { partId, eifId, boxId, sectionResult: r.result }
}
