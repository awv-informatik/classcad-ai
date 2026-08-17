// 21 — Minimal boolean test: polyline2d circle - polyline2d hole
// Verify booleans work on polyline2d shapes before building the full bracket
const IN = 25.4

export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'BoolTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'BT' })).result

  const b90 = Math.tan(Math.PI / 8) // 0.4142

  // Outer circle (R=40mm) using polyline2d
  const outer = (await api.v1.curve.shape({ id: eifId, name: 'Outer' })).result
  await api.v1.curve.polyline2d({
    id: outer,
    points: [[40,0,0], [0,40,0], [-40,0,0], [0,-40,0]],
    bulges: [b90, b90, b90, b90],
    close: true
  })

  // Inner circle (R=15mm) using circle
  const inner = (await api.v1.curve.shape({ id: eifId, name: 'Inner' })).result
  await api.v1.curve.circle({ id: inner, centerPos: [0, 0, 0], radius: 15 })

  // Subtract
  const r = await api.v1.curve.subtraction2d({ target: outer, tool: inner })
  console.log('[21] subtraction result:', r.maxLevel, r.messages?.map(m => m.message).join('; ') || 'ok')

  // Also test: polyline2d stadium subtracted from polyline2d circle
  const outer2 = (await api.v1.curve.shape({ id: eifId, name: 'Outer2' })).result
  await api.v1.curve.polyline2d({
    id: outer2,
    points: [[40+100,0,0], [100,40,0], [-40+100,0,0], [100,-40,0]],
    bulges: [b90, b90, b90, b90],
    close: true
  })

  const slot = (await api.v1.curve.shape({ id: eifId, name: 'Slot' })).result
  await api.v1.curve.polyline2d({
    id: slot,
    points: [[90,-10,0], [110,-10,0], [110,10,0], [90,10,0]],
    bulges: [0, 1, 0, 1],  // positive = outward
    close: true
  })

  const r2 = await api.v1.curve.subtraction2d({ target: outer2, tool: slot })
  console.log('[21] circle-slot subtraction:', r2.maxLevel, r2.messages?.map(m => m.message).join('; ') || 'ok')

  await snapshot('bool-test')
  console.log('[21] Left: circle minus hole. Right: circle minus stadium.')
}
