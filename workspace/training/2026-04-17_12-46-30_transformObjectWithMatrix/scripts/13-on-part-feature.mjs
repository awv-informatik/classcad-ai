export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PartFeatureTest' })).result

  // Create a parametric box feature (not direct solid)
  const boxFeat = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

  await snapshot('before')

  // Transform the part feature
  const r = await api.v1.common.transformObjectWithMatrix({
    id: boxFeat,
    matrix: [
      [1, 0, 0, 80],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })

  console.log('[13] part feature transform result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages && r.messages.length > 0) {
    console.log('[13] messages:', JSON.stringify(r.messages))
  }
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'part-feature-response')

  await snapshot('after')

  // Also try on the part itself
  const r2 = await api.v1.common.transformObjectWithMatrix({
    id: partId,
    matrix: [
      [1, 0, 0, 0],
      [0, 1, 0, 80],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  })

  console.log('[13] part transform result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages && r2.messages.length > 0) {
    console.log('[13] part messages:', JSON.stringify(r2.messages))
  }
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'part-response')

  await snapshot('after-part-transform')

  return { partId }
}
