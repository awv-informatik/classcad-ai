export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  const roundTrips = []

  // Round-trip lines
  for (let i = 0; i < 12; i++) {
    const byIndex = await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: i })
    const geomId = byIndex.result
    const backToIndex = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId })
    const match = backToIndex.result === i
    console.log(`[06] line: index ${i} → id ${geomId} → index ${backToIndex.result} ${match ? '✓' : '❌'}`)
    roundTrips.push({ type: 'line', origIndex: i, geomId, recoveredIndex: backToIndex.result, match })
  }

  // Round-trip faces
  for (let i = 0; i < 6; i++) {
    const byIndex = await api.v1.part.getBrepGeometryByIndex({ id: boxId, faceIndex: i })
    const geomId = byIndex.result
    const backToIndex = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId })
    const match = backToIndex.result === i
    console.log(`[06] face: index ${i} → id ${geomId} → index ${backToIndex.result} ${match ? '✓' : '❌'}`)
    roundTrips.push({ type: 'face', origIndex: i, geomId, recoveredIndex: backToIndex.result, match })
  }

  // Round-trip points
  for (let i = 0; i < 8; i++) {
    const byIndex = await api.v1.part.getBrepGeometryByIndex({ id: boxId, pointIndex: i })
    const geomId = byIndex.result
    const backToIndex = await api.v1.part.getBrepGeometryIndex({ id: boxId, geomId })
    const match = backToIndex.result === i
    console.log(`[06] point: index ${i} → id ${geomId} → index ${backToIndex.result} ${match ? '✓' : '❌'}`)
    roundTrips.push({ type: 'point', origIndex: i, geomId, recoveredIndex: backToIndex.result, match })
  }

  const allMatch = roundTrips.every(r => r.match)
  console.log(`[06] All round-trips match: ${allMatch}`)
  filewrite(roundTrips, 'round-trips')
  return { partId }
}
