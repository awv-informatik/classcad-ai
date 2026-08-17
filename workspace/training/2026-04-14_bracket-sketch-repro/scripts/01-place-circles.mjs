// Script 01: Place all construction circles
// Goal: Verify circle positions against the source drawing before adding lines/trim
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Bracket' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const noGen = {
    genFixation: false, genIncidence: false,
    genVertAndHoriz: false, genTangency: false,
  }

  // Hub center = (0, 0)

  // 1. Ø100 hub contour — R=50
  const hub = (await api.v1.sketch.circle({
    id: skId, centerPos: [0, 0, 0], radius: 50, ...noGen,
  })).result
  console.log('[01] hub R50:', hub)

  // 2. R60 outer transition arc
  const outer = (await api.v1.sketch.circle({
    id: skId, centerPos: [0, 0, 0], radius: 60, ...noGen,
  })).result
  console.log('[01] outer R60:', outer)

  // 3-10. Bolt holes and boss circles at (±25, ±25)
  const boltPositions = [
    [-25, 25],  // UL (135°)
    [25, 25],   // UR (45°)
    [-25, -25], // LL (225°)
    [25, -25],  // LR (315°)
  ]

  const bossIds = []
  const holeIds = []
  for (const [bx, by] of boltPositions) {
    const boss = (await api.v1.sketch.circle({
      id: skId, centerPos: [bx, by, 0], radius: 13, ...noGen,
    })).result
    bossIds.push(boss)

    const hole = (await api.v1.sketch.circle({
      id: skId, centerPos: [bx, by, 0], radius: 7, ...noGen,
    })).result
    holeIds.push(hole)
  }
  console.log('[01] boss IDs:', bossIds)
  console.log('[01] hole IDs:', holeIds)

  // 11. Right boss outer Ø44 — R=22 at (148, -2)
  const rbOuter = (await api.v1.sketch.circle({
    id: skId, centerPos: [148, -2, 0], radius: 22, ...noGen,
  })).result
  console.log('[01] right boss outer R22:', rbOuter)

  // 12. Right boss inner Ø19 — R=9.5 at (148, -2)
  const rbInner = (await api.v1.sketch.circle({
    id: skId, centerPos: [148, -2, 0], radius: 9.5, ...noGen,
  })).result
  console.log('[01] right boss inner R9.5:', rbInner)

  // 13. Ø20 intermediate hole — R=10 at estimated (80, -20)
  const midHole = (await api.v1.sketch.circle({
    id: skId, centerPos: [80, -20, 0], radius: 10, ...noGen,
  })).result
  console.log('[01] mid hole R10:', midHole)

  await snapshot('construction-circles')

  return { partId, skId }
}
