// Test copyFrom between feature-based sketches (part.sketch)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FeatureSketch' })).result

  // Source: feature-based sketch with rectangle + circle
  const srcSkId = (await api.v1.part.sketch({ id: partId })).result
  await api.v1.sketch.rectangle({ id: srcSkId, startPos: [0, 0, 0], endPos: [50, 35, 0] })
  await api.v1.sketch.circle({ id: srcSkId, centerPos: [25, 17, 0], radius: 8 })
  console.log('[08] source feature sketch:', srcSkId)

  await snapshot('source')

  // Destination: another feature-based sketch
  const dstSkId = (await api.v1.part.sketch({ id: partId })).result
  console.log('[08] dest feature sketch:', dstSkId)

  // Copy from feature sketch to feature sketch
  const r = await api.v1.sketch.copyFrom({ id: dstSkId, toCopyId: srcSkId })
  console.log('[08] copyFrom result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'feature-to-feature')

  await snapshot('dest-after-copy')

  return { partId }
}
