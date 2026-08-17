// Error handling: pass completely invalid ID
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvalidId' })).result

  // Pass nonexistent ID
  const r = await api.v1.sketch.splitCurvesMergeBack({ id: 99999 })
  console.log('[12] invalid id result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[12] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'invalid-id')

  return { partId }
}
