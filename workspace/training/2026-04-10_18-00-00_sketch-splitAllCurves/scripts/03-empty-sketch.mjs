// 03 — Empty sketch (no curves). What happens?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SplitEmpty' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.splitAllCurves({ id: skId })
  console.log('[03] result:', JSON.stringify(r.result))
  console.log('[03] maxLevel:', r.maxLevel)
  console.log('[03] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'empty-response')
  return { partId }
}
