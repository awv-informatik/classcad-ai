// Script 02 — full skeleton: top + waist fillets + R36 + R54 + bottom slot circles.
// Hypothesis: R54 centered at (0, -26) so it bottoms out at y=-80 (matches the "80" dim).
// Ø40, R35 concentric with R54.
// R36 unknown — place as full circle at origin for now to see if it looks right.
// R20 fillets at (±X, 0) — where X chosen so R20 circle is tangent externally to R96 and R54.

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
  const mk = async (cx, cy, r, tag) => {
    const id = (await api.v1.sketch.circle({
      id: skId, centerPos: [cx, cy, 0], radius: r, ...noGen,
    })).result
    return { id, cx, cy, r, tag }
  }

  // ── TOP ──
  const hub50 = await mk(0, 0, 25, 'hub50')
  const hub_inner = await mk(0, 0, 15, 'hub_inner') // guess Ø30
  const dome = await mk(0, 0, 96, 'R96_dome')
  const pitch = await mk(0, 0, 64, 'R64_pitch')
  const deg = a => (a * Math.PI) / 180
  const h1 = await mk(64 * Math.cos(deg(30)), 64 * Math.sin(deg(30)), 15, 'h_right')
  const h2 = await mk(0, 64, 15, 'h_top')
  const h3 = await mk(64 * Math.cos(deg(150)), 64 * Math.sin(deg(150)), 15, 'h_left')

  // ── LOWER BODY ──
  // Hypothesis 1: R54 centered at (0, -26), bottoms at -80
  const yLow = -26
  const R54 = await mk(0, yLow, 54, 'R54_body')
  const Phi40 = await mk(0, yLow, 20, 'Phi40_boss') // Ø40 = R20
  const R35 = await mk(0, yLow, 35, 'R35_inner')

  // Hypothesis: R36 as a circle at origin (just to see where it falls)
  const R36 = await mk(0, 0, 36, 'R36_hub_ring?')

  // R20 waist fillets: put at intersection of R96 and R54
  // External tangent to R96 from outside: center at distance 96-20 = 76 from origin (internal tangent)
  // External tangent to R54 from outside: center at distance 54-20 = 34 from (0,yLow)
  //   (if R20 is a rounded INNER corner filling between the two big arcs from outside)
  // Distance eq: cx² + cy² = 76², cx² + (cy-yLow)² = 34²
  //   Subtract: -2*cy*yLow + yLow² = 34² - 76² = 1156 - 5776 = -4620
  //   -2*cy*(-26) + 676 = -4620
  //   52 cy = -5296 → cy = -101.8 — too far below; this is the wrong config
  //
  // Try: R20 tangent externally to R96 (distance = 96+20=116) and externally to R54 (54+20=74)
  //   cx² + cy² = 116² = 13456
  //   cx² + (cy+26)² = 74² = 5476   [wait, yLow=-26, so distance to yLow is (cy-(-26))² = (cy+26)²]
  //   Subtract: (cy+26)² - cy² = 5476 - 13456 = -7980
  //   52 cy + 676 = -7980 → cy = -166.5 — nope
  //
  // Try: R20 is at the EDGE of the waist — where R96 comes around to meet R54
  // Just place R20 circles at visually plausible spot: approximately at (±55, 0)
  const R20L = await mk(-55, 0, 20, 'R20_waistL')
  const R20R = await mk(55, 0, 20, 'R20_waistR')

  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  filewrite(geo, 'geometry')
  console.log('[02] total circles:', geo.circles.length)
  console.log('[02] hub50:', hub50.id, 'hub_inner:', hub_inner.id)
  console.log('[02] dome:', dome.id, 'pitch:', pitch.id)
  console.log('[02] holes:', h1.id, h2.id, h3.id)
  console.log('[02] R54:', R54.id, 'Ø40:', Phi40.id, 'R35:', R35.id, 'R36:', R36.id)
  console.log('[02] R20L:', R20L.id, 'R20R:', R20R.id)

  await snapshot('02-skeleton-full')
  return { skId }
}
