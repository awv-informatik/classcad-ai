// 03 — extend: TRUE vs FALSE comparison on a box
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExtendTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Box with extend: TRUE
  const box1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[03] box1:', box1)

  const r1 = await api.v1.solid.offset({ id: eifId, target: box1, distance: 5, extend: true })
  console.log('[03] extend=TRUE result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[03] extend=TRUE messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'extend-true-response')

  await snapshot('extend-true')

  return { result: r1.result }
}
