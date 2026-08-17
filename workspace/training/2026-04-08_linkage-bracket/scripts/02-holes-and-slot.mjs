// 02 — Holes + left slot, all dimensions converted from inches to mm (×25.4)
//
// Drawing dimensions are in inches. ClassCAD works in mm.
// Conversion: 1 inch = 25.4 mm
//
const IN = 25.4  // inches to mm

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinkageBracket' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'Holes' })).result

  // === THREE HOLES ===

  // Ø1.625" — center at (2.125", 0.250")
  const h1625 = (await api.v1.curve.shape({ id: eifId, name: 'Hole_D1625' })).result
  await api.v1.curve.circle({ id: h1625, centerPos: [2.125*IN, 0.250*IN, 0], radius: 0.8125*IN })

  // Ø0.750" — 0.750" right of Ø1.625 center, at y=0.750"
  const h0750 = (await api.v1.curve.shape({ id: eifId, name: 'Hole_D0750' })).result
  await api.v1.curve.circle({ id: h0750, centerPos: [2.875*IN, 0.750*IN, 0], radius: 0.375*IN })

  // Ø1.125" — to the right, on centerline
  const h1125 = (await api.v1.curve.shape({ id: eifId, name: 'Hole_D1125' })).result
  await api.v1.curve.circle({ id: h1125, centerPos: [3.500*IN, 0.000*IN, 0], radius: 0.5625*IN })

  // === LEFT OBLONG SLOT ===
  // Stadium shape: two R.750" semicircles connected by straight lines
  // Center at (1.000", 0), caps 0.750" apart
  const slot = (await api.v1.curve.shape({ id: eifId, name: 'LeftSlot' })).result
  await api.v1.curve.polyline2d({
    id: slot,
    points: [
      [0.625*IN, -0.750*IN, 0],
      [1.375*IN, -0.750*IN, 0],
      [1.375*IN,  0.750*IN, 0],
      [0.625*IN,  0.750*IN, 0],
    ],
    bulges: [0, 1, 0, 1],
    close: true
  })

  // === REFERENCE LINES ===
  const ref = (await api.v1.curve.shape({ id: eifId, name: 'Ref' })).result
  await api.v1.curve.line({ id: ref, startPos: [-0.3*IN, 0, 0], endPos: [6.2*IN, 0, 0] })       // centerline
  await api.v1.curve.line({ id: ref, startPos: [0, -1.2*IN, 0], endPos: [0, 1.5*IN, 0] })        // left edge
  await api.v1.curve.line({ id: ref, startPos: [5.804*IN, -1.2*IN, 0], endPos: [5.804*IN, 1.5*IN, 0] }) // right edge
  await api.v1.curve.line({ id: ref, startPos: [-0.1*IN, 0.9375*IN, 0], endPos: [1.8*IN, 0.9375*IN, 0] })  // top@left
  await api.v1.curve.line({ id: ref, startPos: [-0.1*IN, -0.9375*IN, 0], endPos: [1.8*IN, -0.9375*IN, 0] }) // bot@left
  await api.v1.curve.line({ id: ref, startPos: [1.000*IN, -1.0*IN, 0], endPos: [1.000*IN, 1.0*IN, 0] })    // x=1.000

  await snapshot('holes-slot-v2')

  console.log('[02] All dimensions in mm (x25.4 from inches)')
  console.log('  Ø1.625 @ (' + (2.125*IN).toFixed(1) + ', ' + (0.250*IN).toFixed(1) + ') r=' + (0.8125*IN).toFixed(1))
  console.log('  Ø0.750 @ (' + (2.875*IN).toFixed(1) + ', ' + (0.750*IN).toFixed(1) + ') r=' + (0.375*IN).toFixed(1))
  console.log('  Ø1.125 @ (' + (3.500*IN).toFixed(1) + ', 0) r=' + (0.5625*IN).toFixed(1))
  console.log('  Left slot caps at ' + (0.625*IN).toFixed(1) + ' and ' + (1.375*IN).toFixed(1))
}
