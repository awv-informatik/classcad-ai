// Test: bulge on zero-length segment (duplicate consecutive points)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DupBulge' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const b90 = Math.tan(Math.PI / 8)

  // Duplicate points with zero bulge (should be ok — zero-length line)
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'dupZero' })).result
  const r1 = await api.v1.curve.polyline2d({
    id: s1,
    points: [[0, 0, 0], [0, 0, 0], [40, 0, 0]],
    bulges: [0, 0, 0],
  })
  console.log('[08] dup points zero bulge:', r1.maxLevel)

  // Duplicate points with non-zero bulge (arc on zero-length segment — what happens?)
  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'dupBulge' })).result
  try {
    const r2 = await api.v1.curve.polyline2d({
      id: s2,
      points: [[0, -30, 0], [0, -30, 0], [40, -30, 0]],
      bulges: [b90, 0, 0],
    })
    console.log('[08] dup points with bulge:', r2.maxLevel)
    if (r2.messages?.length) {
      r2.messages.forEach(m => console.log('[08]   msg:', m.message, 'level:', m.level))
    }
  } catch (e) {
    console.log('[08] dup points with bulge threw:', e.message)
  }

  await snapshot('dup-bulge')
  return { partId }
}
