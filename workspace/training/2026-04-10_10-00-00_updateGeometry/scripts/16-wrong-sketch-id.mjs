// Test: Pass geometry from sketch A with sketch B's ID
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const skA = (await api.v1.sketch.create({ id: partId })).result
  const skB = (await api.v1.sketch.create({ id: partId })).result

  // Create a circle in sketch A
  const geo = await api.v1.sketch.geometry({
    id: skA,
    circles: [{ centerPos: [25, 25, 0], radius: 15 }],
    genFixation: false,
  })
  const circId = geo.result.circles[0]
  console.log('[16] created circle in skA:', circId, 'skA:', skA, 'skB:', skB)

  // Try to update it using skB's ID
  const r = await api.v1.sketch.updateGeometry({
    id: skB,
    circles: [{ id: circId, centerPos: [50, 50, 0], radius: 20 }],
  })
  console.log('[16] wrong sketch result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[16] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'wrong-sketch')

  return { partId }
}
