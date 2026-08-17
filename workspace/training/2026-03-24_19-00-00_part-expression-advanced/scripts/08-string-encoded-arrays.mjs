// Test @expr.NAME inside string-encoded point arrays (offsets, positions)
// The expressions.md doc says this works for workCSys offset, workAxis position, etc.
// Let's test with box references (work coordinate system)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'offsetX', value: 50 },
      { name: 'offsetY', value: 30 },
      { name: 'offsetZ', value: 20 },
    ],
  })

  // Create a work coordinate system with expression-driven offset
  const wcsId = (await api.v1.part.workCSys({
    id: partId,
    name: 'OffsetWCS',
    offset: '[@expr.offsetX, @expr.offsetY, @expr.offsetZ]',
  })).result
  console.log('[08] wcsId:', wcsId, wcsId === null ? 'FAILED' : 'OK')

  if (wcsId) {
    // Place a box at the offset WCS
    const boxId = (await api.v1.part.box({
      id: partId,
      name: 'OffsetBox',
      references: [wcsId],
      length: 40,
      width: 40,
      height: 40,
    })).result
    console.log('[08] boxId:', boxId)
    await snapshot('string-encoded-offset')
  }

  return { partId, wcsId }
}
