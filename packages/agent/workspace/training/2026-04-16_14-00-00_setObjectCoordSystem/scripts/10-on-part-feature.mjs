// Test setObjectCoordSystem on a part feature (part.box) — not direct solid
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CoordSysFeat' })).result
  const boxFeatId = (await api.v1.part.box({
    id: partId, name: 'Box1', length: 60, width: 40, height: 30
  })).result
  console.log('[10] partId:', partId, 'boxFeatId:', boxFeatId)

  await snapshot('before')

  // Set coord system on the part feature
  const r = await api.v1.common.setObjectCoordSystem({
    id: boxFeatId,
    origin: [100, 100, 0],
    xVec: [1, 0, 0],
    yVec: [0, 1, 0],
  })
  console.log('[10] on part.box feature result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages.length > 0) console.log('[10] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'feat-response')

  await snapshot('after-feat')

  return { partId, boxFeatId }
}
