// Script 01 — skeleton: place central hub + 3 holes + R96 as full circle
// Goal: see how the upper portion lays out. Trim later.

export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'Exercise' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  const noGen = {
    genFixation: false, genIncidence: false,
    genVertAndHoriz: false, genTangency: false,
  }

  // Central hub: Ø50 outer + guess Ø30 inner
  const hub50 = (await api.v1.sketch.circle({
    id: skId, centerPos: [0, 0, 0], radius: 25, ...noGen,
  })).result
  const hub30 = (await api.v1.sketch.circle({
    id: skId, centerPos: [0, 0, 0], radius: 15, ...noGen,
  })).result

  // 3 holes Ø30 on R64 pitch circle, at 30°, 90°, 150°
  const R = 64
  const holePositions = [
    [R * Math.cos((30 * Math.PI) / 180), R * Math.sin((30 * Math.PI) / 180)],
    [0, R], // 90°
    [R * Math.cos((150 * Math.PI) / 180), R * Math.sin((150 * Math.PI) / 180)],
  ]
  const holeIds = []
  for (const [x, y] of holePositions) {
    const id = (await api.v1.sketch.circle({
      id: skId, centerPos: [x, y, 0], radius: 15, ...noGen,
    })).result
    holeIds.push(id)
  }

  // R96 outer dome — place as full circle for now
  const dome = (await api.v1.sketch.circle({
    id: skId, centerPos: [0, 0, 0], radius: 96, ...noGen,
  })).result

  // R64 pitch circle for visual reference (construction)
  const pitch = (await api.v1.sketch.circle({
    id: skId, centerPos: [0, 0, 0], radius: 64, ...noGen,
  })).result

  console.log('[01] hub50:', hub50, 'hub30:', hub30)
  console.log('[01] holeIds:', holeIds)
  console.log('[01] dome R96:', dome, 'pitch R64:', pitch)
  console.log('[01] hole positions:', holePositions)

  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  filewrite(geo, 'geometry')

  await snapshot('01-skeleton-top')
  return { skId }
}
