// Circle profile — correct param name: centerPos not center
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CircleCorrect' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'CircProf' })).result
  const circResult = await api.v1.curve.circle({
    id: shapeId,
    centerPos: [45, 0, 0],
    radius: 8,
  })
  console.log('[11] circle result:', circResult.result, 'maxLevel:', circResult.maxLevel)
  // circle returns VOID, not an ID

  const r = await api.v1.solid.revolve({
    id: eifId, originPos: [0, 0, 0], direction: [0, 1, 0],
    angle: Math.PI * 2, curves: shapeId,
  })

  console.log('[11] revolve with circle profile:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[11] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'circle-correct-result')

  if (r.result) await snapshot('circle-torus')
  return { partId }
}
