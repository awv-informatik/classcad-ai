// Can you open a feature twice? Or open two features without closing?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'DoubleOpen' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 20, height: 50 })).result
  console.log('[07] boxId:', boxId, 'cylId:', cylId)

  // Open box
  const r1 = await api.v1.part.openFeature({ id: boxId })
  console.log('[07] open box — result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Try opening box again (double open same feature)
  const r2 = await api.v1.part.openFeature({ id: boxId })
  console.log('[07] open box again — result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages) {
    for (const m of r2.messages) console.log('[07] msg:', m.level, m.message)
  }

  // Close box
  await api.v1.part.closeFeature({ id: boxId })

  // Now test: open box, then open cylinder without closing box
  const r3 = await api.v1.part.openFeature({ id: boxId })
  console.log('[07] open box (fresh) — result:', r3.result, 'maxLevel:', r3.maxLevel)

  const r4 = await api.v1.part.openFeature({ id: cylId })
  console.log('[07] open cyl without closing box — result:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages) {
    for (const m of r4.messages) console.log('[07] msg:', m.level, m.message)
  }

  // Clean up — close whatever is open
  await api.v1.part.closeFeature({ id: cylId })
  await api.v1.part.closeFeature({ id: boxId })

  return { partId, boxId, cylId }
}
