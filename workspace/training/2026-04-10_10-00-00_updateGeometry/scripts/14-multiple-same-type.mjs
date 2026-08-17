// Test: Update multiple circles in one call
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const geo = await api.v1.sketch.geometry({
    id: skId,
    circles: [
      { centerPos: [20, 20, 0], radius: 10 },
      { centerPos: [60, 20, 0], radius: 10 },
      { centerPos: [40, 50, 0], radius: 10 },
    ],
    genFixation: false,
  })
  const [c1, c2, c3] = geo.result.circles
  console.log('[14] created circles:', c1, c2, c3)

  await snapshot('before')

  // Update all 3 in one call
  const r = await api.v1.sketch.updateGeometry({
    id: skId,
    circles: [
      { id: c1, centerPos: [20, 20, 0], radius: 20 },
      { id: c2, centerPos: [60, 20, 0], radius: 5 },
      { id: c3, centerPos: [40, 60, 0], radius: 15 },
    ],
  })
  console.log('[14] batch circles result:', r.result, 'maxLevel:', r.maxLevel)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'multiple-circles')

  await snapshot('after')

  return { partId }
}
