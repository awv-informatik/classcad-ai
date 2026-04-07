// Test extreme bulge values: very small, very large, exactly 0, exactly 1
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ExtremeBulge' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const tests = [
    { name: 'zero', bulge: 0 },
    { name: 'tiny', bulge: 0.001 },
    { name: 'quarter', bulge: Math.tan(Math.PI / 16) }, // 45° → ~0.199
    { name: 'half', bulge: 0.5 },
    { name: 'one', bulge: 1.0 },   // semicircle (180°)
    { name: 'two', bulge: 2.0 },   // >180° arc
    { name: 'five', bulge: 5.0 },  // major arc
    { name: 'hundred', bulge: 100 }, // nearly full circle
    { name: 'neg-one', bulge: -1.0 }, // CW semicircle
  ]

  const results = []
  for (let i = 0; i < tests.length; i++) {
    const t = tests[i]
    const yOff = i * 50
    const s = (await api.v1.curve.shape({ id: eifId, name: t.name })).result
    const r = await api.v1.curve.polyline2d({
      id: s,
      points: [[0, yOff, 0], [40, yOff, 0]],
      bulges: [t.bulge, 0],
    })
    const entry = { name: t.name, bulge: t.bulge, maxLevel: r.maxLevel }
    console.log(`[04] ${t.name}: bulge=${t.bulge}, maxLevel=${r.maxLevel}`)
    results.push(entry)
  }

  filewrite(results, 'extreme-bulge')
  await snapshot('extreme-bulge')
  return { partId }
}
