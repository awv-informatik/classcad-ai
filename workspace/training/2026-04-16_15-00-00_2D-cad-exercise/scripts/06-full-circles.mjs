// Script 06 — All outer profile shapes as full circles (skeleton).
// Will trim in later script. Just place + verify positions match source visually.
// Computations (exact):
//  R36 centers: (±60 cos30°, 60 sin30°) = (±51.962, 30) — tangent internal to R96 @ ±30° endpoints.
//  R20 centers: solved from dist-to-R36 = 56 AND dist-to-R54(0,-26) = 74 → (±73.867, -21.540)
// Print all positions and radii.

export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'Exercise' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  const noGen = { genFixation: false, genIncidence: false, genVertAndHoriz: false, genTangency: false }
  const deg = a => (a * Math.PI) / 180

  // Refine R20c with bisection until both constraints satisfied to 1e-12
  function solveR20() {
    // Along line: 103.923... cx + 112 cy = 5264
    const A = 60 * Math.sqrt(3)
    // Newton on f(cy) = cx² + (cy+26)² - 5476, with cx = (5264 - 112 cy)/A
    let cy = -21.54
    for (let i = 0; i < 30; i++) {
      const cx = (5264 - 112 * cy) / A
      const f = cx * cx + (cy + 26) * (cy + 26) - 5476
      const dcx_dcy = -112 / A
      const fp = 2 * cx * dcx_dcy + 2 * (cy + 26)
      cy -= f / fp
    }
    const cx = (5264 - 112 * cy) / A
    return { cx, cy }
  }
  const R20c = solveR20()
  console.log('[06] R20c solved:', R20c)

  // Verify distances
  const R36c = { x: 60 * Math.cos(deg(30)), y: 60 * Math.sin(deg(30)) }
  const d36 = Math.hypot(R20c.cx - R36c.x, R20c.cy - R36c.y)
  const d54 = Math.hypot(R20c.cx - 0, R20c.cy - -26)
  console.log('[06] dist R20↔R36:', d36, '(want 56)')
  console.log('[06] dist R20↔R54:', d54, '(want 74)')

  // ── Place full circles ──
  const mk = async (cx, cy, r) =>
    (await api.v1.sketch.circle({ id: skId, centerPos: [cx, cy, 0], radius: r, ...noGen })).result

  const hub50 = await mk(0, 0, 25)
  const hub_inner = await mk(0, 0, 15)
  const dome = await mk(0, 0, 96)
  const h1 = await mk(64 * Math.cos(deg(30)), 64 * Math.sin(deg(30)), 15)
  const h2 = await mk(0, 64, 15)
  const h3 = await mk(64 * Math.cos(deg(150)), 64 * Math.sin(deg(150)), 15)

  const R36R = await mk(R36c.x, R36c.y, 36)
  const R36L = await mk(-R36c.x, R36c.y, 36)

  const R20R = await mk(R20c.cx, R20c.cy, 20)
  const R20L = await mk(-R20c.cx, R20c.cy, 20)

  const R54 = await mk(0, -26, 54)
  const Phi40 = await mk(0, -26, 20)
  const R35 = await mk(0, -26, 35)

  await snapshot('06-full-circles')
  return { skId, ids: { hub50, hub_inner, dome, h1, h2, h3, R36R, R36L, R20R, R20L, R54, Phi40, R35 } }
}
