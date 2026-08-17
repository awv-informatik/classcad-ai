// Error handling: pass part ID instead of sketch ID
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WrongId' })).result

  // Pass part ID to mergeBack
  const r = await api.v1.sketch.splitCurvesMergeBack({ id: partId })
  console.log('[11] partId mergeBack result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[11] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'wrong-id-type')

  return { partId }
}
