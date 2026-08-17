export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'WeightedCogTest' })).result

  // Two boxes at different positions to verify COG is volume-weighted
  // Box1: 100x100x100 at origin => vol=1000000, cog=[50,50,50]
  const box1Id = (await api.v1.part.box({ id: partId, name: 'BigBox', length: 100, width: 100, height: 100 })).result

  // Box2: 20x20x20 at translation [200,0,0] => vol=8000, cog=[210,10,10]
  const wcs = (await api.v1.part.workCSys({
    id: partId,
    name: 'WCS1',
    origin: [200, 0, 0],
    xDirection: [1, 0, 0],
    yDirection: [0, 1, 0],
  })).result
  const box2Id = (await api.v1.part.box({
    id: partId,
    name: 'SmallBox',
    length: 20,
    width: 20,
    height: 20,
    references: [wcs],
  })).result
  console.log('[12] box1Id:', box1Id, 'box2Id:', box2Id)

  const r = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[12] result:', JSON.stringify(r.result))
  console.log('[12] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'weighted-cog')

  // Expected:
  // vol = 1000000 + 8000 = 1008000
  // cogX = (1000000*50 + 8000*210) / 1008000 = (50000000 + 1680000) / 1008000 = 51680000 / 1008000 ≈ 51.27
  // cogY = (1000000*50 + 8000*10) / 1008000 = (50000000 + 80000) / 1008000 ≈ 49.68
  // cogZ = same as Y ≈ 49.68
  const totalVol = 1000000 + 8000
  const cogX = (1000000 * 50 + 8000 * 210) / totalVol
  const cogY = (1000000 * 50 + 8000 * 10) / totalVol
  const cogZ = (1000000 * 50 + 8000 * 10) / totalVol
  console.log('[12] expected vol:', totalVol, 'cogX:', cogX.toFixed(2), 'cogY:', cogY.toFixed(2), 'cogZ:', cogZ.toFixed(2))

  await snapshot('weighted-cog')
  return { partId }
}
