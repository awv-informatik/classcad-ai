// 01 — Place all known circles at estimated positions to verify layout
// Goal: visual check of circle positions against the reference drawing
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LinkageBracket' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'Layout' })).result

  // === HOLES (full circles) ===

  // Ø0.750 — small hole, upper area
  const h1 = (await api.v1.curve.shape({ id: eifId, name: 'Hole_0750' })).result
  await api.v1.curve.circle({ id: h1, centerPos: [2.875, 0.875, 0], radius: 0.375 })

  // Ø1.625 — medium hole, center-upper
  const h2 = (await api.v1.curve.shape({ id: eifId, name: 'Hole_1625' })).result
  await api.v1.curve.circle({ id: h2, centerPos: [2.125, 0.125, 0], radius: 0.8125 })

  // Ø1.125 — medium hole, center
  const h3 = (await api.v1.curve.shape({ id: eifId, name: 'Hole_1125' })).result
  await api.v1.curve.circle({ id: h3, centerPos: [2.617, -0.125, 0], radius: 0.5625 })

  // === CONSTRUCTION CIRCLES (outline references) ===

  // Ø1.750 — bottom outline arc
  const c1 = (await api.v1.curve.shape({ id: eifId, name: 'Constr_1750' })).result
  await api.v1.curve.circle({ id: c1, centerPos: [2.617, -0.625, 0], radius: 0.875 })

  // R1.375 — bottom-right outline arc (estimate center)
  const c2 = (await api.v1.curve.shape({ id: eifId, name: 'Constr_R1375' })).result
  await api.v1.curve.circle({ id: c2, centerPos: [4.929, -0.625, 0], radius: 1.375 })

  // R1.750 — top outline arc (estimate center above part)
  const c3 = (await api.v1.curve.shape({ id: eifId, name: 'Constr_R1750' })).result
  await api.v1.curve.circle({ id: c3, centerPos: [2.000, -0.500, 0], radius: 1.750 })

  // Left slot — two semicircle centers as small markers + the full outline
  const ls = (await api.v1.curve.shape({ id: eifId, name: 'LeftSlot' })).result
  // Left semicircle (full circle for now)
  await api.v1.curve.circle({ id: ls, centerPos: [0.625, 0, 0], radius: 0.750 })
  // Right semicircle
  await api.v1.curve.circle({ id: ls, centerPos: [1.375, 0, 0], radius: 0.750 })

  // Right boss center marker — R.875 outline
  const rb = (await api.v1.curve.shape({ id: eifId, name: 'RightBoss_R875' })).result
  await api.v1.curve.circle({ id: rb, centerPos: [4.929, 0.000, 0], radius: 0.875 })

  // Also place a bounding reference: horizontal line at y=0 (centerline)
  const ref = (await api.v1.curve.shape({ id: eifId, name: 'Centerline' })).result
  await api.v1.curve.line({ id: ref, startPos: [-0.5, 0, 0], endPos: [6.5, 0, 0] })
  // Bounding box reference
  await api.v1.curve.line({ id: ref, startPos: [0, -1.5, 0], endPos: [0, 1.5, 0] }) // left edge
  await api.v1.curve.line({ id: ref, startPos: [5.804, -1.5, 0], endPos: [5.804, 1.5, 0] }) // right edge
  await api.v1.curve.line({ id: ref, startPos: [0, 0.9375, 0], endPos: [2, 0.9375, 0] }) // top at left (1.875/2)
  await api.v1.curve.line({ id: ref, startPos: [0, -0.9375, 0], endPos: [2, -0.9375, 0] }) // bottom at left

  await snapshot('layout-v1')

  console.log('[01] All circles and references placed.')
  console.log('[01] Holes: Ø0.750 @(2.875, 0.875), Ø1.625 @(2.125, 0.125), Ø1.125 @(2.617, -0.125)')
  console.log('[01] Construction: Ø1.750 @(2.617, -0.625), R1.375 @(4.929, -0.625), R1.750 @(2.000, -0.500)')
  console.log('[01] Left slot caps: @(0.625, 0) and @(1.375, 0) R=0.750')
  console.log('[01] Right boss: @(4.929, 0) R=0.875')
}
