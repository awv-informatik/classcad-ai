// Check the maxLevel on successful lookups — is it 0 or 31?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0]
  })).result

  const regionId = (await api.v1.sketch.sketchRegion({
    id: skId, geomIds: rectIds, name: 'Test'
  })).result

  const r = await api.v1.sketch.getSketchRegion({ id: skId, name: 'Test' })
  console.log('[12] result:', r.result)
  console.log('[12] maxLevel:', r.maxLevel)
  console.log('[12] messages:', JSON.stringify(r.messages))
  console.log('[12] result type:', typeof r.result)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages, resultType: typeof r.result }, 'success-envelope')

  return { partId }
}
