// Test sketch.geometry — mixed types in a single call
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GeomTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.geometry({
    id: skId,
    points: [{ pos: [0, 0, 0] }, { pos: [60, 60, 0] }],
    lines: [{ startPos: [0, 0, 0], endPos: [60, 0, 0] }, { startPos: [60, 0, 0], endPos: [60, 60, 0] }],
    arcsBy3Points: [{ startPos: [60, 60, 0], endPos: [0, 60, 0], midPos: [30, 80, 0] }],
    arcsByCenter: [{ startPos: [0, 60, 0], endPos: [0, 0, 0], centerPos: [-20, 30, 0] }],
    circles: [{ centerPos: [30, 30, 0], radius: 10 }],
  })

  console.log('[06] result:', JSON.stringify(r.result))
  console.log('[06] maxLevel:', r.maxLevel)
  console.log('[06] points count:', r.result.points?.length)
  console.log('[06] lines count:', r.result.lines?.length)
  console.log('[06] arcsBy3Points count:', r.result.arcsBy3Points?.length)
  console.log('[06] arcsByCenter count:', r.result.arcsByCenter?.length)
  console.log('[06] circles count:', r.result.circles?.length)
  filewrite({ result: r.result, maxLevel: r.maxLevel }, 'mixed-response')

  await snapshot('mixed')
  return { partId }
}
