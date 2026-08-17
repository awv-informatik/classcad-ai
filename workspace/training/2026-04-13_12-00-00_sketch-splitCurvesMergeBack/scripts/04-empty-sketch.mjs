// mergeBack on an empty sketch (no geometry at all)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EmptySketch' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  console.log('[04] calling mergeBack on empty sketch')
  const mergeR = await api.v1.sketch.splitCurvesMergeBack({ id: skId })
  console.log('[04] mergeBack result:', mergeR.result)
  console.log('[04] mergeBack maxLevel:', mergeR.maxLevel)
  console.log('[04] mergeBack messages:', JSON.stringify(mergeR.messages))
  filewrite({ result: mergeR.result, maxLevel: mergeR.maxLevel, messages: mergeR.messages }, 'mergeBack-empty')

  return { partId }
}
