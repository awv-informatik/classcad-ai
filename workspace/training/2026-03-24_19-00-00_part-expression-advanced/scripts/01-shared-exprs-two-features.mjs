// Two features sharing the same expressions: a box and a cylinder both driven by shared params
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'baseSize', value: 100 },
      { name: 'wallHeight', value: 60 },
      { name: 'holeDiam', value: 'baseSize * 0.4' },
    ],
  })

  // Box uses baseSize for L/W, wallHeight for H
  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'Base',
    length: '@expr.baseSize',
    width: '@expr.baseSize',
    height: '@expr.wallHeight',
  })).result
  console.log('[01] boxId:', boxId, 'maxLevel:', (await api.v1.part.box({ id: partId })).maxLevel)

  // Cylinder uses holeDiam (derived from baseSize) and wallHeight
  const cylId = (await api.v1.part.cylinder({
    id: partId,
    name: 'Hole',
    diameter: '@expr.holeDiam',
    height: '@expr.wallHeight',
  })).result
  console.log('[01] cylId:', cylId)

  await snapshot('shared-exprs')
  return { partId, boxId, cylId }
}
