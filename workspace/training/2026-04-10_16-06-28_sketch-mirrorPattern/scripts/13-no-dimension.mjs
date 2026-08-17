// Verify: mirrorPattern does NOT return a dimension (unlike linear/circular)
// Also check if there's an updateMirrorPattern API
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circle = (await api.v1.sketch.circle({ id: skId, centerPos: [10, 10, 0], radius: 5 })).result
  const rsId = (await api.v1.sketch.rigidSet({ id: skId, geomIds: [circle] })).result
  const symLine = (await api.v1.sketch.line({ id: skId, startPos: [25, -10, 0], endPos: [25, 30, 0] })).result

  const r = await api.v1.sketch.mirrorPattern({ id: skId, rigidSetId: rsId, symmetryLineId: symLine })

  // Check all keys in the result
  console.log('[13] result keys:', Object.keys(r.result))
  console.log('[13] has dimension?:', 'dimension' in r.result)
  console.log('[13] has dimensions?:', 'dimensions' in r.result)
  console.log('[13] full result:', JSON.stringify(r.result))

  filewrite(r.result, 'result-keys')

  // Check if updateMirrorPattern exists
  console.log('[13] updateMirrorPattern exists?:', typeof api.v1.sketch.updateMirrorPattern)

  return { partId }
}
