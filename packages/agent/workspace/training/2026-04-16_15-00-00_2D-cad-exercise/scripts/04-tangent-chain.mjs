// Script 04 — derive tangent-chain positions analytically.
// Chain: R96 (top dome, at origin) ⇄ R36 (arm, tangent INTERNAL to R96 at ±30° endpoints)
//     ⇄ R20 (waist fillet, tangent EXTERNAL to R36 and EXTERNAL to R54)
//     ⇄ R54 (bottom body, at (0,-26) so bottom=y=-80 per "80" dim from origin)
// R36 right center = (60 cos30°, 60 sin30°) = (51.96, 30)
// R20 right center: solved from {dist to R36=56, dist to R54 center=74} ⇒ (~73.83, -21.5)
// Ø40/R35 concentric with R54 at (0,-26)
// R36 dim annotation to confirm.

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

  // ── Derivations ──
  // R36 arm center (right): 60*(cos30, sin30)
  const xR36 = 60 * Math.cos(deg(30))
  const yR36 = 60 * Math.sin(deg(30))

  // R20 waist fillet center (right): solve (cx - xR36)^2 + (cy - yR36)^2 = 56^2 and cx^2 + (cy+26)^2 = 74^2
  // Linear: 103.92 cx + 112 cy = 5264  (derivation from expanding + subtracting)
  // Numerical solve along this line:
  function solveR20() {
    const a = 103.92, b = 112, c = 5264
    // cy -> cx = (c - b cy) / a
    // Substitute into cx^2 + (cy+26)^2 = 5476
    // Scan cy between -40 and 10
    let best = null, bestErr = Infinity
    for (let cy = -40; cy <= 10; cy += 0.01) {
      const cx = (c - b * cy) / a
      const err = cx * cx + (cy + 26) * (cy + 26) - 5476
      if (Math.abs(err) < bestErr) {
        bestErr = Math.abs(err); best = { cx, cy }
      }
    }
    return best
  }
  const R20c = solveR20()
  console.log('[04] R36R center:', [xR36, yR36], 'R20R center:', R20c)

  // ── Geometry placement ──
  // Top
  const hub50 = await mk(0, 0, 25)
  const hub_inner = await mk(0, 0, 15)
  const dome = await mk(0, 0, 96)
  const pitch = await mk(0, 0, 64)
  const h1 = await mk(64 * Math.cos(deg(30)), 64 * Math.sin(deg(30)), 15)
  const h2 = await mk(0, 64, 15)
  const h3 = await mk(64 * Math.cos(deg(150)), 64 * Math.sin(deg(150)), 15)

  // Arms
  const R36R = await mk(xR36, yR36, 36)
  const R36L = await mk(-xR36, yR36, 36)

  // Waist fillets
  const R20R = await mk(R20c.cx, R20c.cy, 20)
  const R20L = await mk(-R20c.cx, R20c.cy, 20)

  // Lower body
  const R54 = await mk(0, -26, 54)
  const Phi40 = await mk(0, -26, 20)
  const R35 = await mk(0, -26, 35)

  // Dimensions — minimal for now
  await api.v1.sketch.dimension([
    { id: skId, type: 'RADIUS', geomIds: [dome] },
    { id: skId, type: 'RADIUS', geomIds: [R36R] },
    { id: skId, type: 'RADIUS', geomIds: [R20R] },
    { id: skId, type: 'RADIUS', geomIds: [R54] },
    { id: skId, type: 'RADIUS', geomIds: [R35] },
    { id: skId, type: 'DIAMETER', geomIds: [Phi40] },
    { id: skId, type: 'DIAMETER', geomIds: [hub50] },
    { id: skId, type: 'DIAMETER', geomIds: [h1] },
  ])

  await snapshot('04-tangent-chain')

  return { skId }
}
