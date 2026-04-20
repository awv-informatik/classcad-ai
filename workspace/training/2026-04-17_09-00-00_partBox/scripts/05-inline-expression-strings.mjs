export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoxInlineExprTest' })).result

  // Box with inline math expressions (no named expressions)
  const r = await api.v1.part.box({
    id: partId,
    name: 'MathBox',
    length: '3*25',
    width: '2*20+10',
    height: 'sqrt(2500)',
  })
  console.log('[05] inline expr box result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'inline-expr-response')

  await snapshot('inline-expr')
  return { partId, boxId: r.result }
}
