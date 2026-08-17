// Edge case: very large and very small coordinates
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LargeCoords' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Very large coords
  const r1 = await api.v1.sketch.point({ id: skId, pos: [1e6, 1e6, 0] })
  console.log('[13] large coords (1e6,1e6) — result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Very small coords
  const r2 = await api.v1.sketch.point({ id: skId, pos: [1e-10, 1e-10, 0] })
  console.log('[13] tiny coords (1e-10,1e-10) — result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Verify positions
  if (r1.result) {
    const p1 = await api.v1.sketch.getPositions({ id: r1.result })
    console.log('[13] large pos:', JSON.stringify(p1.result))
  }
  if (r2.result) {
    const p2 = await api.v1.sketch.getPositions({ id: r2.result })
    console.log('[13] tiny pos:', JSON.stringify(p2.result))
  }

  filewrite({ large: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
              tiny: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages } }, 'large-coords')
  return { partId, skId }
}
