// Test getSketch name case sensitivity
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const skId = (await api.v1.part.sketch({ id: partId, name: 'MySketch' })).result
  console.log('[07] created sketch id:', skId, 'name: MySketch')

  // Exact match
  const r1 = await api.v1.part.getSketch({ id: partId, name: 'MySketch' })
  console.log('[07] exact "MySketch":', r1.result, 'match:', r1.result === skId)

  // All lowercase
  const r2 = await api.v1.part.getSketch({ id: partId, name: 'mysketch' })
  console.log('[07] lowercase "mysketch":', r2.result, 'maxLevel:', r2.maxLevel)

  // All uppercase
  const r3 = await api.v1.part.getSketch({ id: partId, name: 'MYSKETCH' })
  console.log('[07] uppercase "MYSKETCH":', r3.result, 'maxLevel:', r3.maxLevel)

  // Mixed case
  const r4 = await api.v1.part.getSketch({ id: partId, name: 'mySketch' })
  console.log('[07] mixed "mySketch":', r4.result, 'maxLevel:', r4.maxLevel)

  filewrite({
    exact: { result: r1.result, maxLevel: r1.maxLevel },
    lower: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    upper: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    mixed: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'case-sensitivity-response')

  return { partId }
}
