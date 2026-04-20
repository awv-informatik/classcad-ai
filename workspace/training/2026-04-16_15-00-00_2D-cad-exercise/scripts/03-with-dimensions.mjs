// Script 03 — verify positions with dimensions.
// Hypothesis:
// - R96 dome, R36 arms tangent to R96 internally at 30°/150° endpoints.
// - R20 fillets at waist connecting R36 to R54.
// - R54 bottom, centered at (0,-26) so it reaches y=-80.
// Add DIAMETER/RADIUS dimensions so values are rendered.

export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'Exercise' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }
  const mk = async (cx, cy, r) =>
    (await api.v1.sketch.circle({ id: skId, centerPos: [cx, cy, 0], radius: r, ...noGen })).result

  const deg = a => (a * Math.PI) / 180

  // Central hub
  const hub50 = await mk(0, 0, 25)
  const hub_inner = await mk(0, 0, 15)

  // 3 holes @ R64
  const h1 = await mk(64 * Math.cos(deg(30)), 64 * Math.sin(deg(30)), 15)
  const h2 = await mk(0, 64, 15)
  const h3 = await mk(64 * Math.cos(deg(150)), 64 * Math.sin(deg(150)), 15)

  // Dome and pitch
  const dome = await mk(0, 0, 96)
  const pitch = await mk(0, 0, 64)

  // Lower body
  const yLow = -26
  const R54 = await mk(0, yLow, 54)
  const Phi40 = await mk(0, yLow, 20)
  const R35 = await mk(0, yLow, 35)

  // R36 "arms": tangent internally to R96 at ±30° endpoints
  // R96 endpoint R = (96 cos30, 96 sin30); center of tangent internal R36 at (60 cos30, 60 sin30)
  const xArm = 60 * Math.cos(deg(30))
  const yArm = 60 * Math.sin(deg(30))
  const R36R = await mk(xArm, yArm, 36)
  const R36L = await mk(-xArm, yArm, 36)

  // R20 waist fillets — approximate positions (to adjust later)
  const R20R = await mk(55, 0, 20)
  const R20L = await mk(-55, 0, 20)

  // ── DIMENSIONS ──
  await api.v1.sketch.dimension([
    { id: skId, type: 'DIAMETER', geomIds: [hub50] },
    { id: skId, type: 'DIAMETER', geomIds: [hub_inner] },
    { id: skId, type: 'DIAMETER', geomIds: [h1] },
    { id: skId, type: 'RADIUS', geomIds: [pitch] },
    { id: skId, type: 'RADIUS', geomIds: [dome] },
    { id: skId, type: 'RADIUS', geomIds: [R54] },
    { id: skId, type: 'DIAMETER', geomIds: [Phi40] },
    { id: skId, type: 'RADIUS', geomIds: [R35] },
    { id: skId, type: 'RADIUS', geomIds: [R36R] },
    { id: skId, type: 'RADIUS', geomIds: [R20R] },
  ])

  console.log('[03] dome R96:', dome, '| R36R center:', [xArm, yArm])
  console.log('[03] R54 center:', [0, yLow], '| R35, Ø40 concentric with R54')

  await snapshot('03-with-dimensions')
  return { skId }
}
