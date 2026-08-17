// Practical reference: build a comprehensive bulge → angle table
// and test a realistic rounded rectangle using bulges
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PracticalRef' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Reference table: common angles and their bulge values
  const table = [10, 20, 30, 45, 60, 90, 120, 135, 150, 180, 210, 240, 270, 300, 330, 350].map(deg => {
    const rad = (deg * Math.PI) / 180
    const bulge = Math.tan(rad / 4)
    return { deg, bulge: Math.round(bulge * 1000000) / 1000000 }
  })
  console.log('[09] Bulge reference table:')
  table.forEach(t => console.log(`  ${String(t.deg).padStart(3)}° → ${t.bulge}`))
  filewrite(table, 'bulge-table')

  // Practical: rounded rectangle with 5mm corner radius (using 90° bulge)
  const b90 = Math.tan(Math.PI / 8)
  const w = 80, h = 40, r = 5
  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'roundedRect' })).result
  const rr = await api.v1.curve.polyline2d({
    id: s1,
    points: [
      [r, 0, 0],
      [w - r, 0, 0],     // bottom edge
      [w, r, 0],          // bottom-right corner (arc here)
      [w, h - r, 0],      // right edge
      [w - r, h, 0],      // top-right corner (arc here)
      [r, h, 0],          // top edge
      [0, h - r, 0],      // top-left corner (arc here)
      [0, r, 0],          // left edge -> bottom-left corner (arc here via close)
    ],
    bulges: [0, b90, 0, b90, 0, b90, 0, b90],
    close: true,
  })
  console.log('[09] rounded rect maxLevel:', rr.maxLevel)
  if (rr.messages?.length) {
    rr.messages.forEach(m => console.log('[09]   msg:', m.message, 'level:', m.level))
  }

  await snapshot('practical-reference')
  return { partId }
}
