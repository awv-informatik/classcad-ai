// 03 — isCentered: compare centered vs non-centered rectangles
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CenterTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Non-centered: startPos is corner, endPos is opposite corner
  const r1 = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [60, 40, 0],
  })
  console.log('[03] non-centered IDs:', r1.result)

  // Get positions of non-centered rect
  for (let i = 0; i < r1.result.length; i++) {
    const pos = await api.v1.sketch.getPositions({ id: r1.result[i] })
    console.log(`[03] non-centered line[${i}]:`, JSON.stringify(pos.result))
  }

  // Centered: startPos is center, endPos defines half-size
  const r2 = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 70, 0],
    endPos: [60, 110, 0],
    isCentered: 1, // TRUE
  })
  console.log('[03] centered IDs:', r2.result)

  for (let i = 0; i < r2.result.length; i++) {
    const pos = await api.v1.sketch.getPositions({ id: r2.result[i] })
    console.log(`[03] centered line[${i}]:`, JSON.stringify(pos.result))
  }

  await snapshot('centered-comparison')
  return { partId }
}
