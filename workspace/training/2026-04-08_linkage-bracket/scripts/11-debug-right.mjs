// 11 — Debug: just draw a circle at right boss position + the outline
// Verify the renderer shows geometry at x > 100mm
const IN = 25.4

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Debug' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'D' })).result

  // Test circle at right boss position
  const c1 = (await api.v1.curve.shape({ id: eifId, name: 'RBossTest' })).result
  await api.v1.curve.circle({ id: c1, centerPos: [4.929*IN, 0, 0], radius: 0.875*IN })

  // Test circle at left position for comparison
  const c2 = (await api.v1.curve.shape({ id: eifId, name: 'LBossTest' })).result
  await api.v1.curve.circle({ id: c2, centerPos: [1.000*IN, 0, 0], radius: 0.750*IN })

  // Test arc at right boss — half circle
  const a1 = (await api.v1.curve.shape({ id: eifId, name: 'RBossArc' })).result
  const r = await api.v1.curve.arcByCenter({
    id: a1,
    centerPos: [4.929*IN, 0, 0],
    startPos: [4.929*IN, 0.875*IN, 0],  // top
    endPos: [4.929*IN, -0.875*IN, 0],    // bottom
    isClockwise: true   // CW from top to bottom = right semicircle
  })
  console.log('[11] R.875 semicircle:', r.result, 'maxLevel:', r.maxLevel,
    r.messages ? JSON.stringify(r.messages) : 'no messages')

  // Centerline for reference
  const ref = (await api.v1.curve.shape({ id: eifId, name: 'Ref' })).result
  await api.v1.curve.line({ id: ref, startPos: [-10, 0, 0], endPos: [160, 0, 0] })

  await snapshot('debug-right')
  console.log('[11] Two circles + one arc placed')
}
