// 05 — Edge case: section plane does not intersect the solid
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SectionNoHit' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Box: [-40,40] x [-30,30] x [-20,20]
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  // Section at z=50 — well above the box (max z=20)
  const r = await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 50],
    normal: [0, 0, 1],
  })

  console.log('[05] no-intersection result:', r.result)
  console.log('[05] maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  await snapshot('after')

  return { partId, eifId, boxId, sectionResult: r.result }
}
